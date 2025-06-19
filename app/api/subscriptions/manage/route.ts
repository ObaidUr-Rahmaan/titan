import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createDirectClient } from '@/lib/drizzle'
import { users, subscriptionChanges } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { 
  logSubscriptionUpgraded,
  logSubscriptionDowngraded,
  logPlanChangeInitiated 
} from '@/utils/billing-activity-logger'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { action, fromTier, toTier, subscriptionId, effectiveDate } = body

    if (!action || !fromTier || !toTier || !subscriptionId) {
      return NextResponse.json({ 
        error: 'Missing required fields: action, fromTier, toTier, subscriptionId' 
      }, { status: 400 })
    }

    const db = createDirectClient()

    // Record the subscription change
    const [changeRecord] = await db
      .insert(subscriptionChanges)
      .values({
        userId,
        stripeSubscriptionId: subscriptionId,
        fromTier,
        toTier,
        changeType: action === 'upgrade' ? 'upgrade' : 'downgrade',
        changeStatus: effectiveDate ? 'scheduled' : 'pending',
        effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
        metadata: {
          source: 'web',
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

    // Log plan change initiation
    await logPlanChangeInitiated(userId, fromTier, toTier, action, changeRecord.id)

    return NextResponse.json({
      success: true,
      message: `Subscription ${action} ${effectiveDate ? 'scheduled' : 'initiated'} successfully`,
      changeId: changeRecord.id,
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

    const db = createDirectClient()

    // Get user's subscription changes
    const changes = await db
      .select()
      .from(subscriptionChanges)
      .where(eq(subscriptionChanges.userId, userId))
      .orderBy(subscriptionChanges.createdAt)

    // Get current user subscription
    const [user] = await db
      .select({ subscription: users.subscription })
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1)

    return NextResponse.json({
      success: true,
      data: {
        currentSubscription: user?.subscription || 'free',
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