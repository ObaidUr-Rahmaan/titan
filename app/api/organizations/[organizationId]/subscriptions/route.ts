import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createDirectClient } from '@/lib/drizzle'
import { 
  organizations, 
  organizationMemberships, 
  subscriptions, 
  subscriptionsPlans 
} from '@/db/schema'
import { eq, and, or } from 'drizzle-orm'
import { z } from 'zod'

// Schema for updating organization subscription
const updateOrgSubscriptionSchema = z.object({
  action: z.enum(['add_seats', 'remove_seats', 'change_plan', 'update_billing']),
  seatCount: z.number().min(1).optional(),
  planId: z.string().optional(),
  autoAddSeats: z.boolean().optional(),
  billingEmail: z.string().email().optional()
})

// Helper to verify organization access with billing permissions
async function verifyOrgBillingAccess(userId: string, organizationId: string) {
  const db = createDirectClient()
  
  const membership = await db
    .select({
      role: organizationMemberships.role,
      isActive: organizationMemberships.isActive
    })
    .from(organizationMemberships)
    .where(
      and(
        eq(organizationMemberships.clerkUserId, userId),
        eq(organizationMemberships.organizationId, parseInt(organizationId)),
        eq(organizationMemberships.isActive, true),
        or(
          eq(organizationMemberships.role, 'owner'),
          eq(organizationMemberships.role, 'admin'),
          eq(organizationMemberships.role, 'billing_manager')
        )
      )
    )
    .limit(1)

  return membership.length > 0 ? membership[0] : null
}

// GET /api/organizations/[organizationId]/subscriptions
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { organizationId } = await params

    // Verify user has access to organization
    const membership = await verifyOrgBillingAccess(userId, organizationId)
    if (!membership) {
      return NextResponse.json({ 
        error: 'No access to organization billing' 
      }, { status: 403 })
    }

    const db = createDirectClient()

    // Get organization details with subscription info
    const [org] = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        subscriptionStatus: organizations.subscriptionStatus,
        subscriptionTier: organizations.subscriptionTier,
        memberLimit: organizations.memberLimit,
        currentMemberCount: organizations.currentMemberCount,
        stripeCustomerId: organizations.stripeCustomerId,
        subscriptionExpiresAt: organizations.subscriptionExpiresAt,
        isTrial: organizations.isTrial,
        trialExpiresAt: organizations.trialExpiresAt,
        featuresEnabled: organizations.featuresEnabled
      })
      .from(organizations)
      .where(eq(organizations.id, parseInt(organizationId)))
      .limit(1)

    if (!org) {
      return NextResponse.json({ 
        error: 'Organization not found' 
      }, { status: 404 })
    }

    // Get active subscription details
    const [activeSubscription] = await db
      .select({
        id: subscriptions.id,
        subscriptionId: subscriptions.subscriptionId,
        status: subscriptions.status,
        planId: subscriptions.planId,
        quantity: subscriptions.quantity,
        unitAmount: subscriptions.unitAmount,
        currency: subscriptions.currency,
        currentPeriodStart: subscriptions.currentPeriodStart,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
        seatLimit: subscriptions.seatLimit,
        usedSeats: subscriptions.usedSeats,
        autoAddSeats: subscriptions.autoAddSeats
      })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.organizationId, parseInt(organizationId)),
          eq(subscriptions.isActive, true)
        )
      )
      .limit(1)

    // Get subscription plan details if subscription exists
    let planDetails = null
    if (activeSubscription) {
      const [plan] = await db
        .select({
          name: subscriptionsPlans.name,
          description: subscriptionsPlans.description,
          planType: subscriptionsPlans.planType,
          isPerSeat: subscriptionsPlans.isPerSeat,
          seatPrice: subscriptionsPlans.seatPrice,
          minSeats: subscriptionsPlans.minSeats,
          maxSeats: subscriptionsPlans.maxSeats,
          memberLimit: subscriptionsPlans.memberLimit,
          features: subscriptionsPlans.features
        })
        .from(subscriptionsPlans)
        .where(eq(subscriptionsPlans.planId, activeSubscription.planId))
        .limit(1)
      
      planDetails = plan
    }

    return NextResponse.json({
      success: true,
      data: {
        organization: org,
        subscription: activeSubscription,
        plan: planDetails,
        userRole: membership.role
      }
    })

  } catch (error) {
    console.error('[ORG SUBSCRIPTIONS] Error fetching organization subscription:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// PATCH /api/organizations/[organizationId]/subscriptions
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { organizationId } = await params

    // Verify user has billing access
    const membership = await verifyOrgBillingAccess(userId, organizationId)
    if (!membership) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to manage organization billing' 
      }, { status: 403 })
    }

    // Parse and validate request body
    const body = await req.json()
    const validationResult = updateOrgSubscriptionSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: validationResult.error.format()
      }, { status: 400 })
    }

    const { action, seatCount, planId, autoAddSeats, billingEmail } = validationResult.data
    const db = createDirectClient()

    // Get current subscription
    const [currentSubscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.organizationId, parseInt(organizationId)),
          eq(subscriptions.isActive, true)
        )
      )
      .limit(1)

    if (!currentSubscription) {
      return NextResponse.json({ 
        error: 'No active subscription found for organization' 
      }, { status: 404 })
    }

    let updateData: any = {}
    let message = ''

    switch (action) {
      case 'add_seats':
      case 'remove_seats':
        if (!seatCount) {
          return NextResponse.json({ 
            error: 'seatCount is required for seat management' 
          }, { status: 400 })
        }
        
        const newSeatCount = action === 'add_seats' 
          ? (currentSubscription.quantity || 1) + seatCount
          : Math.max(1, (currentSubscription.quantity || 1) - seatCount)
        
        updateData = { 
          quantity: newSeatCount,
          seatLimit: newSeatCount 
        }
        message = `Successfully ${action === 'add_seats' ? 'added' : 'removed'} ${seatCount} seat(s). New total: ${newSeatCount}`
        break

      case 'change_plan':
        if (!planId) {
          return NextResponse.json({ 
            error: 'planId is required for plan changes' 
          }, { status: 400 })
        }
        updateData = { planId }
        message = `Successfully scheduled plan change to ${planId}`
        break

      case 'update_billing':
        if (autoAddSeats !== undefined) {
          updateData.autoAddSeats = autoAddSeats
        }
        if (billingEmail) {
          updateData.email = billingEmail
        }
        message = 'Successfully updated billing settings'
        break

      default:
        return NextResponse.json({ 
          error: 'Invalid action' 
        }, { status: 400 })
    }

    // Update subscription
    const [updatedSubscription] = await db
      .update(subscriptions)
      .set({
        ...updateData,
        updatedTime: new Date()
      })
      .where(eq(subscriptions.id, currentSubscription.id))
      .returning()

    // Log the change
    console.log(`[ORG SUBSCRIPTIONS] ${action} performed by ${userId} for organization ${organizationId}`)

    return NextResponse.json({
      success: true,
      message,
      data: {
        subscription: updatedSubscription,
        action,
        performedBy: userId,
        organizationId
      }
    })

  } catch (error) {
    console.error('[ORG SUBSCRIPTIONS] Error updating organization subscription:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 