import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createDirectClient } from '@/lib/drizzle'
import { users, subscriptionChanges, organizations, organizationMemberships } from '@/db/schema'
import { eq, and, or } from 'drizzle-orm'
import { 
  logSubscriptionUpgraded,
  logSubscriptionDowngraded,
  logPlanChangeInitiated 
} from '@/utils/billing-activity-logger'
import { z } from 'zod'

// Validation schema for subscription management requests
const subscriptionManageSchema = z.object({
  action: z.enum(['upgrade', 'downgrade', 'cancellation', 'reactivation']),
  fromTier: z.string().min(1),
  toTier: z.string().min(1),
  subscriptionId: z.string().min(1),
  effectiveDate: z.string().optional(),
  // Organization context (optional)
  organizationId: z.string().optional(),
  billingType: z.enum(['individual', 'organization']).optional().default('individual'),
  // Seat management for organizations
  seatChange: z.number().optional(), // Positive for adding seats, negative for removing
  newSeatCount: z.number().min(1).optional()
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validationResult = subscriptionManageSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: validationResult.error.format()
      }, { status: 400 })
    }

    const { 
      action, 
      fromTier, 
      toTier, 
      subscriptionId, 
      effectiveDate,
      organizationId,
      billingType,
      seatChange,
      newSeatCount
    } = validationResult.data

    const db = createDirectClient()

    // Handle organization billing context
    if (billingType === 'organization') {
      if (!organizationId) {
        return NextResponse.json({ 
          error: 'Organization ID is required for organization billing' 
        }, { status: 400 })
      }

      // Verify user has permission to manage organization billing
      const membership = await db
        .select()
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

      if (membership.length === 0) {
        return NextResponse.json({ 
          error: 'Insufficient permissions to manage organization billing' 
        }, { status: 403 })
      }

      // Record the organization subscription change
      const [changeRecord] = await db
        .insert(subscriptionChanges)
        .values({
          userId,
          organizationId: parseInt(organizationId),
          stripeSubscriptionId: subscriptionId,
          fromTier,
          toTier,
          changeType: action, // action is already the correct enum value
          changeStatus: effectiveDate ? 'scheduled' : 'pending',
          effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
          metadata: {
            source: 'web',
            billingType: 'organization',
            seatChange,
            newSeatCount,
            managedBy: userId,
            timestamp: new Date().toISOString(),
            ...body
          }
        })
        .returning()

      // Log the organization activity
      if (action === 'upgrade') {
        await logSubscriptionUpgraded(userId, fromTier, toTier, subscriptionId)
      } else if (action === 'downgrade') {
        await logSubscriptionDowngraded(userId, fromTier, toTier, subscriptionId, 'web')
      }
      // Note: cancellation and reactivation logging may need separate functions

      // Log plan change initiation (only for upgrade/downgrade)
      if (action === 'upgrade' || action === 'downgrade') {
        await logPlanChangeInitiated(userId, fromTier, toTier, action, changeRecord.id)
      }

      return NextResponse.json({
        success: true,
        message: `Organization subscription ${action} ${effectiveDate ? 'scheduled' : 'initiated'} successfully`,
        changeId: changeRecord.id,
        billingType: 'organization',
        organizationId,
        data: changeRecord
      })
    }

    // Handle individual billing (existing logic)
    const [changeRecord] = await db
      .insert(subscriptionChanges)
      .values({
        userId,
        stripeSubscriptionId: subscriptionId,
        fromTier,
        toTier,
        changeType: action, // action is already the correct enum value
        changeStatus: effectiveDate ? 'scheduled' : 'pending',
        effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
        metadata: {
          source: 'web',
          billingType: 'individual',
          timestamp: new Date().toISOString(),
          ...body
        }
      })
      .returning()

    // Log the activity
    if (action === 'upgrade') {
      await logSubscriptionUpgraded(userId, fromTier, toTier, subscriptionId)
    } else if (action === 'downgrade') {
      await logSubscriptionDowngraded(userId, fromTier, toTier, subscriptionId, 'web')
    }

    // Log plan change initiation (only for upgrade/downgrade)
    if (action === 'upgrade' || action === 'downgrade') {
      await logPlanChangeInitiated(userId, fromTier, toTier, action, changeRecord.id)
    }

    return NextResponse.json({
      success: true,
      message: `Subscription ${action} ${effectiveDate ? 'scheduled' : 'initiated'} successfully`,
      changeId: changeRecord.id,
      billingType: 'individual',
      data: changeRecord
    })

  } catch (error) {
    console.error('[SUBSCRIPTION MANAGE] Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const organizationId = searchParams.get('organizationId')
    const billingType = searchParams.get('billingType') || 'individual'

    const db = createDirectClient()

    if (billingType === 'organization' && organizationId) {
      // Verify user has access to organization
      const membership = await db
        .select()
        .from(organizationMemberships)
        .where(
          and(
            eq(organizationMemberships.clerkUserId, userId),
            eq(organizationMemberships.organizationId, parseInt(organizationId)),
            eq(organizationMemberships.isActive, true)
          )
        )
        .limit(1)

      if (membership.length === 0) {
        return NextResponse.json({ 
          error: 'No access to organization' 
        }, { status: 403 })
      }

      // Get organization's subscription changes
      const changes = await db
        .select()
        .from(subscriptionChanges)
        .where(eq(subscriptionChanges.organizationId, parseInt(organizationId)))
        .orderBy(subscriptionChanges.createdAt)

      // Get current organization subscription info
      const [org] = await db
        .select({
          subscriptionStatus: organizations.subscriptionStatus,
          subscriptionTier: organizations.subscriptionTier,
          memberLimit: organizations.memberLimit,
          currentMemberCount: organizations.currentMemberCount
        })
        .from(organizations)
        .where(eq(organizations.id, parseInt(organizationId)))
        .limit(1)

      return NextResponse.json({
        success: true,
        billingType: 'organization',
        organizationId,
        data: {
          currentSubscription: org?.subscriptionTier || 'trial',
          subscriptionStatus: org?.subscriptionStatus || 'trial',
          memberLimit: org?.memberLimit || 0,
          currentMemberCount: org?.currentMemberCount || 0,
          changes: changes || []
        }
      })
    }

    // Get individual user's subscription changes
    const changes = await db
      .select()
      .from(subscriptionChanges)
      .where(eq(subscriptionChanges.userId, userId))
      .orderBy(subscriptionChanges.createdAt)

    // Get current user subscription
    const [user] = await db
      .select({ 
        subscription: users.subscription,
        subscriptionTier: users.subscriptionTier,
        subscriptionStatus: users.subscriptionStatus
      })
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1)

    return NextResponse.json({
      success: true,
      billingType: 'individual',
      data: {
        currentSubscription: user?.subscription || user?.subscriptionTier || 'trial',
        subscriptionStatus: user?.subscriptionStatus || 'trial',
        changes: changes || []
      }
    })

  } catch (error) {
    console.error('[SUBSCRIPTION MANAGE] Error fetching subscription data:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 