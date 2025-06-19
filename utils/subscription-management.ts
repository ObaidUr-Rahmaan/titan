import { createDirectClient } from '@/lib/drizzle'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { logTrialToPaidUpgrade, logSubscriptionExpired } from '@/utils/billing-activity-logger'

/**
 * Upgrade user from trial to paid subscription (non-server version)
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
 * Expire user subscription and downgrade to trial or free tier (non-server version)
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