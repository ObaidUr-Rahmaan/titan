import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createDirectClient } from '@/lib/drizzle'
import { organizations, organizationMemberships } from '@/db/schema'
import { eq, and, or } from 'drizzle-orm'
import Stripe from 'stripe'
import { applyRateLimit } from '@/lib/ratelimit'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : undefined

// Helper to verify organization billing access
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

  return membership.length > 0
}

// POST /api/organizations/[organizationId]/billing-portal
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  // Apply rate limiting
  const rateLimit = await applyRateLimit(req, "payment")
  if (!rateLimit.success) {
    return new NextResponse(
      JSON.stringify({ error: "Too many requests" }),
      { 
        status: 429, 
        headers: rateLimit.headers 
      }
    )
  }

  if (!stripe) {
    console.error('[ORG BILLING PORTAL] Missing STRIPE_SECRET_KEY environment variable')
    return NextResponse.json({ error: 'Stripe configuration error' }, { status: 500 })
  }

  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { organizationId } = await params

    // Verify user has billing access to organization
    const hasAccess = await verifyOrgBillingAccess(userId, organizationId)
    if (!hasAccess) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to access organization billing' 
      }, { status: 403 })
    }

    const db = createDirectClient()

    // Get organization with Stripe customer ID
    const [org] = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        stripeCustomerId: organizations.stripeCustomerId
      })
      .from(organizations)
      .where(eq(organizations.id, parseInt(organizationId)))
      .limit(1)

    if (!org) {
      return NextResponse.json({ 
        error: 'Organization not found' 
      }, { status: 404 })
    }

    if (!org.stripeCustomerId) {
      return NextResponse.json({ 
        error: 'No Stripe customer ID found for organization. Please contact support.' 
      }, { status: 400 })
    }

    // Parse request body for return URL
    const body = await req.json().catch(() => ({}))
    const returnUrl = body.returnUrl || `${process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/org/${org.slug}/billing`

    try {
      // Create Stripe billing portal session for the organization
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: org.stripeCustomerId,
        return_url: returnUrl,
        configuration: undefined, // Use default configuration or specify custom one
      })

      console.log(`[ORG BILLING PORTAL] Created billing portal session for organization ${organizationId} by user ${userId}`)

      return NextResponse.json({
        success: true,
        portalUrl: portalSession.url,
        organizationId,
        organizationName: org.name
      }, { 
        headers: rateLimit.headers 
      })

    } catch (stripeError: any) {
      console.error('[ORG BILLING PORTAL] Stripe error creating portal session:', stripeError)
      
      // Handle specific Stripe errors
      if (stripeError.code === 'customer_not_found') {
        return NextResponse.json({ 
          error: 'Customer not found in Stripe. Please contact support.' 
        }, { 
          status: 400,
          headers: rateLimit.headers
        })
      }

      return NextResponse.json({ 
        error: 'Failed to create billing portal session',
        details: stripeError.message
      }, { 
        status: 400,
        headers: rateLimit.headers
      })
    }

  } catch (error) {
    console.error('[ORG BILLING PORTAL] Error creating billing portal session:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { 
      status: 500,
      headers: rateLimit.headers
    })
  }
} 