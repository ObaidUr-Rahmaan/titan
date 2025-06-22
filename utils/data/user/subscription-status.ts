'use server'

import { createDirectClient } from '@/lib/drizzle'
import { users, subscriptions } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { logTrialToPaidUpgrade, logSubscriptionExpired } from '@/utils/billing-activity-logger'

/**
 * Upgrade user from trial to paid subscription
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
        subscription: subscriptionTier, // Use the existing subscription field
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
 * Expire user subscription and downgrade to trial or free tier
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
        subscription: 'free', // Downgrade to free tier using existing subscription field
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

/**
 * Get user subscription details
 */
export async function getUserSubscriptionStatus(
  userId: string
): Promise<{
  success: boolean
  data?: {
    subscription: string | null
  }
  error?: string
}> {
  try {
    const db = createDirectClient()
    
    const [user] = await db
      .select({
        subscription: users.subscription,
      })
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1)
    
    if (!user) {
      return { success: false, error: 'User not found' }
    }
    
    return { success: true, data: user }
  } catch (error) {
    console.error('[SUBSCRIPTION] Error getting user subscription status:', error)
    return { success: false, error: 'Failed to get subscription status' }
  }
}

/**
 * Check if user has active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    const result = await getUserSubscriptionStatus(userId)
    
    if (!result.success || !result.data) {
      return false
    }
    
    const { subscription } = result.data
    
    // User has active subscription if subscription is not null, free, or trial
    return (
      subscription !== null &&
      subscription !== 'free' &&
      subscription !== 'trial'
    )
  } catch (error) {
    console.error('[SUBSCRIPTION] Error checking active subscription:', error)
    return false
  }
}

/**
 * Check if user is in trial period
 */
export async function isInTrialPeriod(userId: string): Promise<boolean> {
  try {
    const result = await getUserSubscriptionStatus(userId)
    
    if (!result.success || !result.data) {
      return false
    }
    
    const { subscription } = result.data
    
    // User is in trial if their subscription indicates trial
    return subscription === 'trial'
  } catch (error) {
    console.error('[SUBSCRIPTION] Error checking trial period:', error)
    return false
  }
} 