'use server'

// Billing activity types for comprehensive tracking
export const BILLING_ACTIVITY_TYPES = {
  SUBSCRIPTION_CREATED: 'subscription_created',
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded', 
  SUBSCRIPTION_DOWNGRADED: 'subscription_downgraded',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  SUBSCRIPTION_REACTIVATED: 'subscription_reactivated',
  SUBSCRIPTION_EXPIRED: 'subscription_expired',
  DOWNGRADE_SCHEDULED: 'downgrade_scheduled',
  DOWNGRADE_CANCELLED: 'downgrade_cancelled',
  PAYMENT_SUCCEEDED: 'payment_succeeded',
  PAYMENT_FAILED: 'payment_failed',
  TRIAL_TO_PAID_UPGRADE: 'trial_to_paid_upgrade',
  TRIAL_STARTED: 'trial_started',
  PLAN_CHANGE_INITIATED: 'plan_change_initiated',
} as const

// Mock activity logger for now - can be enhanced with actual database logging
async function logUserActivity(activity: {
  userId: string
  activityType: string
  title: string
  description: string
  metadata?: any
  source?: 'web' | 'webhook'
  relatedEntityType?: string
  relatedEntityId?: string
}) {
  console.log(`[BILLING ACTIVITY] ${activity.activityType}:`, {
    userId: activity.userId,
    title: activity.title,
    description: activity.description,
    source: activity.source || 'web',
    metadata: activity.metadata,
    timestamp: new Date().toISOString()
  })
  
  // TODO: Implement actual database logging when user_activity table is created
  return { success: true }
}

/**
 * Log subscription creation
 */
export async function logSubscriptionCreated(
  userId: string, 
  subscriptionTier: string, 
  subscriptionId: string, 
  source: 'web' | 'webhook' = 'web'
) {
  return logUserActivity({
    userId,
    activityType: BILLING_ACTIVITY_TYPES.SUBSCRIPTION_CREATED,
    title: `Subscription created - ${subscriptionTier}`,
    description: `New ${subscriptionTier} subscription created`,
    metadata: {
      subscriptionTier,
      subscriptionId,
      timestamp: new Date().toISOString()
    },
    source,
    relatedEntityType: 'subscription',
    relatedEntityId: subscriptionId
  })
}

/**
 * Log subscription upgrade
 */
export async function logSubscriptionUpgraded(
  userId: string, 
  fromTier: string, 
  toTier: string, 
  subscriptionId: string, 
  prorationAmount?: number
) {
  return logUserActivity({
    userId,
    activityType: BILLING_ACTIVITY_TYPES.SUBSCRIPTION_UPGRADED,
    title: `Plan upgraded from ${fromTier} to ${toTier}`,
    description: `Subscription upgraded with ${prorationAmount ? `proration charge of £${prorationAmount.toFixed(2)}` : 'no additional charge'}`,
    metadata: {
      fromTier,
      toTier,
      subscriptionId,
      prorationAmount,
      timestamp: new Date().toISOString()
    },
    relatedEntityType: 'subscription',
    relatedEntityId: subscriptionId
  })
}

/**
 * Log subscription downgrade scheduled
 */
export async function logSubscriptionDowngradeScheduled(
  userId: string, 
  fromTier: string, 
  toTier: string, 
  subscriptionId: string, 
  effectiveDate: Date
) {
  return logUserActivity({
    userId,
    activityType: BILLING_ACTIVITY_TYPES.DOWNGRADE_SCHEDULED,
    title: `Downgrade scheduled from ${fromTier} to ${toTier}`,
    description: `Subscription will downgrade to ${toTier} on ${effectiveDate.toLocaleDateString()}`,
    metadata: {
      fromTier,
      toTier,
      subscriptionId,
      effectiveDate: effectiveDate.toISOString(),
      timestamp: new Date().toISOString()
    },
    relatedEntityType: 'subscription',
    relatedEntityId: subscriptionId
  })
}

/**
 * Log subscription downgrade completed
 */
export async function logSubscriptionDowngraded(
  userId: string, 
  fromTier: string, 
  toTier: string, 
  subscriptionId: string, 
  source: 'web' | 'webhook' = 'webhook'
) {
  return logUserActivity({
    userId,
    activityType: BILLING_ACTIVITY_TYPES.SUBSCRIPTION_DOWNGRADED,
    title: `Plan downgraded from ${fromTier} to ${toTier}`,
    description: `Subscription successfully downgraded to ${toTier}`,
    metadata: {
      fromTier,
      toTier,
      subscriptionId,
      timestamp: new Date().toISOString()
    },
    source,
    relatedEntityType: 'subscription',
    relatedEntityId: subscriptionId
  })
}

/**
 * Log subscription cancellation
 */
export async function logSubscriptionCancelled(
  userId: string, 
  subscriptionTier: string, 
  subscriptionId: string, 
  reason?: string, 
  source: 'web' | 'webhook' = 'web'
) {
  return logUserActivity({
    userId,
    activityType: BILLING_ACTIVITY_TYPES.SUBSCRIPTION_CANCELLED,
    title: `${subscriptionTier} subscription cancelled`,
    description: `Subscription cancelled${reason ? ` - ${reason}` : ''}`,
    metadata: {
      subscriptionTier,
      subscriptionId,
      reason,
      timestamp: new Date().toISOString()
    },
    source,
    relatedEntityType: 'subscription',
    relatedEntityId: subscriptionId
  })
}

/**
 * Log subscription reactivation
 */
export async function logSubscriptionReactivated(
  userId: string, 
  subscriptionTier: string, 
  subscriptionId: string
) {
  return logUserActivity({
    userId,
    activityType: BILLING_ACTIVITY_TYPES.SUBSCRIPTION_REACTIVATED,
    title: `${subscriptionTier} subscription reactivated`,
    description: `Cancelled subscription has been reactivated`,
    metadata: {
      subscriptionTier,
      subscriptionId,
      timestamp: new Date().toISOString()
    },
    relatedEntityType: 'subscription',
    relatedEntityId: subscriptionId
  })
}

/**
 * Log subscription expiration
 */
export async function logSubscriptionExpired(
  userId: string, 
  subscriptionTier: string, 
  subscriptionId: string
) {
  return logUserActivity({
    userId,
    activityType: BILLING_ACTIVITY_TYPES.SUBSCRIPTION_EXPIRED,
    title: `${subscriptionTier} subscription expired`,
    description: `Subscription has expired and access has been revoked`,
    metadata: {
      subscriptionTier,
      subscriptionId,
      timestamp: new Date().toISOString()
    },
    relatedEntityType: 'subscription',
    relatedEntityId: subscriptionId
  })
}

/**
 * Log downgrade cancellation (user decides to keep current plan)
 */
export async function logDowngradeCancelled(
  userId: string, 
  subscriptionTier: string, 
  subscriptionId: string, 
  scheduledToTier: string
) {
  return logUserActivity({
    userId,
    activityType: BILLING_ACTIVITY_TYPES.DOWNGRADE_CANCELLED,
    title: `Scheduled downgrade cancelled`,
    description: `Cancelled scheduled downgrade from ${subscriptionTier} to ${scheduledToTier}`,
    metadata: {
      currentTier: subscriptionTier,
      scheduledToTier,
      subscriptionId,
      timestamp: new Date().toISOString()
    },
    relatedEntityType: 'subscription',
    relatedEntityId: subscriptionId
  })
}

/**
 * Log payment success
 */
export async function logPaymentSucceeded(
  userId: string, 
  amount: number, 
  currency: string, 
  invoiceId: string, 
  subscriptionId?: string
) {
  return logUserActivity({
    userId,
    activityType: BILLING_ACTIVITY_TYPES.PAYMENT_SUCCEEDED,
    title: `Payment successful - ${currency.toUpperCase()} ${(amount / 100).toFixed(2)}`,
    description: `Payment processed successfully for invoice ${invoiceId}`,
    metadata: {
      amount: amount / 100, // Convert from cents
      currency: currency.toUpperCase(),
      invoiceId,
      subscriptionId,
      timestamp: new Date().toISOString()
    },
    relatedEntityType: 'invoice',
    relatedEntityId: invoiceId
  })
}

/**
 * Log payment failure
 */
export async function logPaymentFailed(
  userId: string, 
  amount: number, 
  currency: string, 
  invoiceId: string, 
  reason?: string, 
  subscriptionId?: string
) {
  return logUserActivity({
    userId,
    activityType: BILLING_ACTIVITY_TYPES.PAYMENT_FAILED,
    title: `Payment failed - ${currency.toUpperCase()} ${(amount / 100).toFixed(2)}`,
    description: `Payment failed for invoice ${invoiceId}${reason ? ` - ${reason}` : ''}`,
    metadata: {
      amount: amount / 100, // Convert from cents
      currency: currency.toUpperCase(),
      invoiceId,
      subscriptionId,
      reason,
      timestamp: new Date().toISOString()
    },
    relatedEntityType: 'invoice',
    relatedEntityId: invoiceId
  })
}

/**
 * Log trial to paid upgrade
 */
export async function logTrialToPaidUpgrade(
  userId: string, 
  subscriptionTier: string, 
  subscriptionId: string, 
  source: 'web' | 'webhook' = 'web'
) {
  return logUserActivity({
    userId,
    activityType: BILLING_ACTIVITY_TYPES.TRIAL_TO_PAID_UPGRADE,
    title: `Trial upgraded to ${subscriptionTier}`,
    description: `Successfully upgraded from trial to paid ${subscriptionTier} subscription`,
    metadata: {
      subscriptionTier,
      subscriptionId,
      timestamp: new Date().toISOString()
    },
    source,
    relatedEntityType: 'subscription',
    relatedEntityId: subscriptionId
  })
}

/**
 * Log trial started
 */
export async function logTrialStarted(userId: string, trialEndDate: Date) {
  return logUserActivity({
    userId,
    activityType: BILLING_ACTIVITY_TYPES.TRIAL_STARTED,
    title: `Trial started`,
    description: `Free trial started, expires on ${trialEndDate.toLocaleDateString()}`,
    metadata: {
      trialEndDate: trialEndDate.toISOString(),
      timestamp: new Date().toISOString()
    },
    relatedEntityType: 'user',
    relatedEntityId: userId
  })
}

/**
 * Log plan change initiation
 */
export async function logPlanChangeInitiated(
  userId: string, 
  fromTier: string, 
  toTier: string, 
  changeType: 'upgrade' | 'downgrade', 
  changeId: string
) {
  return logUserActivity({
    userId,
    activityType: BILLING_ACTIVITY_TYPES.PLAN_CHANGE_INITIATED,
    title: `Plan ${changeType} initiated from ${fromTier} to ${toTier}`,
    description: `User initiated ${changeType} from ${fromTier} to ${toTier}`,
    metadata: {
      fromTier,
      toTier,
      changeType,
      changeId,
      timestamp: new Date().toISOString()
    },
    relatedEntityType: 'subscription_change',
    relatedEntityId: changeId
  })
} 