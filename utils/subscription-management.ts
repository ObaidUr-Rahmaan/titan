import { createDirectClient } from '@/lib/drizzle'
import { users, subscriptions, organizations, organizationMemberships } from '@/db/schema'
import { eq, and, or } from 'drizzle-orm'
import { logTrialToPaidUpgrade, logSubscriptionExpired } from '@/utils/billing-activity-logger'

// Types for subscription operations
export type SubscriptionContext = 'individual' | 'organization'

export interface CreateSubscriptionParams {
  context: SubscriptionContext
  clerkUserId?: string // For individual subscriptions
  organizationId?: number // For organization subscriptions
  subscriptionId: string // Stripe subscription ID
  stripeCustomerId: string
  planId: string
  status: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd?: boolean
  seatLimit?: number
  quantity?: number
  email?: string // Customer email
}

export interface UpdateSubscriptionParams {
  subscriptionId: string
  status?: string
  planId?: string
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
  cancelAtPeriodEnd?: boolean
  seatLimit?: number
  quantity?: number
  canceledAt?: Date
  endedAt?: Date
}

/**
 * Create a new subscription (individual or organization)
 */
export async function createSubscription(
  params: CreateSubscriptionParams
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const db = createDirectClient()
    
    // Validate parameters based on context
    if (params.context === 'individual' && !params.clerkUserId) {
      return { success: false, error: 'Clerk user ID required for individual subscriptions' }
    }
    
    if (params.context === 'organization' && !params.organizationId) {
      return { success: false, error: 'Organization ID required for organization subscriptions' }
    }

    // For individual subscriptions, get the internal user ID
    let internalUserId: number | null = null
    if (params.context === 'individual' && params.clerkUserId) {
      const userRecord = await db.select()
        .from(users)
        .where(eq(users.clerkUserId, params.clerkUserId))
        .limit(1)
      
      if (userRecord.length === 0) {
        return { success: false, error: 'User not found in database' }
      }
      
      internalUserId = userRecord[0].id
    }

    // Create the subscription record
    const [newSubscription] = await db
      .insert(subscriptions)
      .values({
        subscriptionId: params.subscriptionId,
        stripeCustomerId: params.stripeCustomerId,
        clerkUserId: params.clerkUserId,
        userId: internalUserId,
        organizationId: params.organizationId,
        planId: params.planId,
        status: params.status,
        startDate: params.currentPeriodStart,
        currentPeriodStart: params.currentPeriodStart,
        currentPeriodEnd: params.currentPeriodEnd,
        cancelAtPeriodEnd: params.cancelAtPeriodEnd || false,
        email: params.email || `${params.clerkUserId || `org-${params.organizationId}`}@placeholder.com`,
        seatLimit: params.seatLimit,
        usedSeats: params.context === 'organization' ? 1 : undefined,
        subscriptionType: params.context,
        quantity: params.quantity || 1
      })
      .returning()

    // For organization subscriptions, update the organization record
    if (params.context === 'organization' && params.organizationId) {
      await db
        .update(organizations)
        .set({
          subscriptionStatus: params.status,
          subscriptionTier: params.planId,
          subscriptionExpiresAt: params.currentPeriodEnd,
          memberLimit: params.seatLimit,
          updatedTime: new Date()
        })
        .where(eq(organizations.id, params.organizationId))
    }

    // For individual subscriptions, update the user record
    if (params.context === 'individual' && internalUserId) {
      await db
        .update(users)
        .set({
          subscription: params.planId
        })
        .where(eq(users.id, internalUserId))
    }

    console.log(`[SUBSCRIPTION] Created ${params.context} subscription ${params.subscriptionId}`)
    
    return { success: true, data: newSubscription }
  } catch (error) {
    console.error('[SUBSCRIPTION] Error creating subscription:', error)
    return { success: false, error: 'Failed to create subscription' }
  }
}

/**
 * Update an existing subscription
 */
export async function updateSubscription(
  params: UpdateSubscriptionParams
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const db = createDirectClient()
    
    // Get the existing subscription to determine context
    const existingSubscription = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.subscriptionId, params.subscriptionId))
      .limit(1)
    
    if (existingSubscription.length === 0) {
      return { success: false, error: 'Subscription not found' }
    }
    
    const subscription = existingSubscription[0]
    
    // Update the subscription record
    const updateData: any = {}
    if (params.status !== undefined) updateData.status = params.status
    if (params.planId !== undefined) updateData.planId = params.planId
    if (params.currentPeriodStart !== undefined) updateData.currentPeriodStart = params.currentPeriodStart
    if (params.currentPeriodEnd !== undefined) updateData.currentPeriodEnd = params.currentPeriodEnd
    if (params.cancelAtPeriodEnd !== undefined) updateData.cancelAtPeriodEnd = params.cancelAtPeriodEnd
    if (params.seatLimit !== undefined) updateData.seatLimit = params.seatLimit
    if (params.quantity !== undefined) updateData.quantity = params.quantity
    if (params.canceledAt !== undefined) updateData.canceledAt = params.canceledAt
    if (params.endedAt !== undefined) updateData.endedAt = params.endedAt
    
    updateData.updatedTime = new Date()

    const [updatedSubscription] = await db
      .update(subscriptions)
      .set(updateData)
      .where(eq(subscriptions.subscriptionId, params.subscriptionId))
      .returning()

    // Update related records based on subscription type
    if (subscription.subscriptionType === 'organization' && subscription.organizationId) {
      const orgUpdateData: any = { updatedTime: new Date() }
      
      if (params.status !== undefined) orgUpdateData.subscriptionStatus = params.status
      if (params.planId !== undefined) orgUpdateData.subscriptionTier = params.planId
      if (params.currentPeriodEnd !== undefined) orgUpdateData.subscriptionExpiresAt = params.currentPeriodEnd
      if (params.seatLimit !== undefined) orgUpdateData.memberLimit = params.seatLimit
      
      await db
        .update(organizations)
        .set(orgUpdateData)
        .where(eq(organizations.id, subscription.organizationId))
    }
    
    if (subscription.subscriptionType === 'individual' && subscription.userId) {
      if (params.planId !== undefined) {
        await db
          .update(users)
          .set({ subscription: params.planId })
          .where(eq(users.id, subscription.userId))
      }
    }

    console.log(`[SUBSCRIPTION] Updated ${subscription.subscriptionType} subscription ${params.subscriptionId}`)
    
    return { success: true, data: updatedSubscription }
  } catch (error) {
    console.error('[SUBSCRIPTION] Error updating subscription:', error)
    return { success: false, error: 'Failed to update subscription' }
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  immediately: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = createDirectClient()
    
    // Get the subscription
    const existingSubscription = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.subscriptionId, subscriptionId))
      .limit(1)
    
    if (existingSubscription.length === 0) {
      return { success: false, error: 'Subscription not found' }
    }
    
    const subscription = existingSubscription[0]
    const now = new Date()
    
    // Update subscription status
    const updateData: any = {
      canceledAt: now,
      updatedTime: now
    }
    
    if (immediately) {
      updateData.status = 'canceled'
      updateData.endedAt = now
      updateData.cancelAtPeriodEnd = false
    } else {
      updateData.cancelAtPeriodEnd = true
    }

    await db
      .update(subscriptions)
      .set(updateData)
      .where(eq(subscriptions.subscriptionId, subscriptionId))

    // Handle organization subscription cancellation
    if (subscription.subscriptionType === 'organization' && subscription.organizationId) {
      const orgUpdateData: any = { updatedTime: now }
      
      if (immediately) {
        orgUpdateData.subscriptionStatus = 'canceled'
        orgUpdateData.subscriptionTier = 'free'
      }
      
      await db
        .update(organizations)
        .set(orgUpdateData)
        .where(eq(organizations.id, subscription.organizationId))
    }
    
    // Handle individual subscription cancellation
    if (subscription.subscriptionType === 'individual' && subscription.userId) {
      if (immediately) {
        await db
          .update(users)
          .set({ subscription: 'free' })
          .where(eq(users.id, subscription.userId))
      }
    }

    console.log(`[SUBSCRIPTION] Canceled ${subscription.subscriptionType} subscription ${subscriptionId}${immediately ? ' immediately' : ' at period end'}`)
    
    return { success: true }
  } catch (error) {
    console.error('[SUBSCRIPTION] Error canceling subscription:', error)
    return { success: false, error: 'Failed to cancel subscription' }
  }
}

/**
 * Get subscription by ID
 */
export async function getSubscription(
  subscriptionId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const db = createDirectClient()
    
    const subscription = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.subscriptionId, subscriptionId))
      .limit(1)
    
    if (subscription.length === 0) {
      return { success: false, error: 'Subscription not found' }
    }
    
    return { success: true, data: subscription[0] }
  } catch (error) {
    console.error('[SUBSCRIPTION] Error getting subscription:', error)
    return { success: false, error: 'Failed to get subscription' }
  }
}

/**
 * Get subscriptions for a user (individual context)
 */
export async function getUserSubscriptions(
  clerkUserId: string
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const db = createDirectClient()
    
    const userSubscriptions = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.clerkUserId, clerkUserId))
    
    return { success: true, data: userSubscriptions }
  } catch (error) {
    console.error('[SUBSCRIPTION] Error getting user subscriptions:', error)
    return { success: false, error: 'Failed to get user subscriptions' }
  }
}

/**
 * Get subscriptions for an organization
 */
export async function getOrganizationSubscriptions(
  organizationId: number
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const db = createDirectClient()
    
    const orgSubscriptions = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.organizationId, organizationId))
    
    return { success: true, data: orgSubscriptions }
  } catch (error) {
    console.error('[SUBSCRIPTION] Error getting organization subscriptions:', error)
    return { success: false, error: 'Failed to get organization subscriptions' }
  }
}

/**
 * Update seat usage for organization subscription
 */
export async function updateSeatUsage(
  organizationId: number,
  usedSeats: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = createDirectClient()
    
    // Get the organization's active subscription
    const orgSubscriptions = await db.select()
      .from(subscriptions)
      .where(and(
        eq(subscriptions.organizationId, organizationId),
        eq(subscriptions.subscriptionType, 'organization'),
        or(
          eq(subscriptions.status, 'active'),
          eq(subscriptions.status, 'trialing')
        )
      ))
      .limit(1)
    
    if (orgSubscriptions.length === 0) {
      return { success: false, error: 'No active organization subscription found' }
    }
    
    const subscription = orgSubscriptions[0]
    
    // Check if we're exceeding seat limit
    if (subscription.seatLimit && usedSeats > subscription.seatLimit) {
      // If auto-add seats is enabled, we could handle this automatically
      // For now, we'll just warn
      console.warn(`[SUBSCRIPTION] Organization ${organizationId} exceeding seat limit: ${usedSeats}/${subscription.seatLimit}`)
    }
    
    await db
      .update(subscriptions)
      .set({
        usedSeats,
        updatedTime: new Date()
      })
      .where(eq(subscriptions.id, subscription.id))
    
    // Update organization member count
    await db
      .update(organizations)
      .set({
        currentMemberCount: usedSeats,
        updatedTime: new Date()
      })
      .where(eq(organizations.id, organizationId))
    
    console.log(`[SUBSCRIPTION] Updated seat usage for organization ${organizationId}: ${usedSeats}/${subscription.seatLimit || 'unlimited'}`)
    
    return { success: true }
  } catch (error) {
    console.error('[SUBSCRIPTION] Error updating seat usage:', error)
    return { success: false, error: 'Failed to update seat usage' }
  }
}

// Legacy functions for backward compatibility
/**
 * Upgrade user from trial to paid subscription (legacy - individual only)
 */
export async function upgradeUserFromTrialToPaid(
  userId: string,
  subscriptionTier: string,
  subscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = createDirectClient()
    
    // Update user subscription status
    const [updatedUser] = await db
      .update(users)
      .set({
        subscription: subscriptionTier,
      })
      .where(eq(users.userId, userId))
      .returning()
    
    if (!updatedUser) {
      return { success: false, error: 'User not found' }
    }
    
    // Log the upgrade activity
    await logTrialToPaidUpgrade(userId, subscriptionTier, subscriptionId, 'webhook')
    
    console.log(`[SUBSCRIPTION] User ${userId} upgraded from trial to ${subscriptionTier}`)
    
    return { success: true }
  } catch (error) {
    console.error('[SUBSCRIPTION] Error upgrading user from trial to paid:', error)
    return { success: false, error: 'Failed to upgrade user subscription' }
  }
}

/**
 * Expire user subscription and downgrade to trial or free tier (legacy - individual only)
 */
export async function expireUserSubscription(
  userId: string,
  subscriptionId: string,
  previousTier?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = createDirectClient()
    
    // Update user to expired/free status
    const [updatedUser] = await db
      .update(users)
      .set({
        subscription: 'free',
      })
      .where(eq(users.userId, userId))
      .returning()
    
    if (!updatedUser) {
      return { success: false, error: 'User not found' }
    }
    
    // Log the expiration activity
    await logSubscriptionExpired(userId, previousTier || 'unknown', subscriptionId)
    
    console.log(`[SUBSCRIPTION] User ${userId} subscription expired, downgraded to free`)
    
    return { success: true }
  } catch (error) {
    console.error('[SUBSCRIPTION] Error expiring user subscription:', error)
    return { success: false, error: 'Failed to expire user subscription' }
  }
} 