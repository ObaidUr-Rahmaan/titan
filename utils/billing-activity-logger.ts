import { createClient } from '@/lib/supabase'

interface BillingActivityLogData {
  userId: string
  activityType: string
  title: string
  description?: string
  metadata?: Record<string, any>
  source?: 'web' | 'api' | 'webhook' | 'admin' | 'cron'
  relatedEntityType?: string
  relatedEntityId?: string
}

/**
 * Log billing activity from API routes (client-side compatible)
 */
export async function logBillingActivity(data: BillingActivityLogData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    
    const activityData = {
      user_id: data.userId,
      activity_type: data.activityType,
      category: 'billing',
      title: data.title,
      description: data.description || null,
      metadata: data.metadata || {},
      source: data.source || 'api',
      related_entity_type: data.relatedEntityType || null,
      related_entity_id: data.relatedEntityId || null,
      created_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('user_activity')
      .insert(activityData)

    if (error) {
      console.error('❌ BILLING ACTIVITY LOG: Database error:', error)
      return {
        success: false,
        error: error.message
      }
    }

    console.log(`✅ BILLING ACTIVITY LOG: Logged activity for user ${data.userId}:`, {
      activityType: data.activityType,
      title: data.title,
      timestamp: new Date().toISOString()
    })

    return { success: true }
  } catch (error) {
    console.error('❌ BILLING ACTIVITY LOG: Failed to log activity:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Billing activity type constants
export const BILLING_ACTIVITY_TYPES = {
  SUBSCRIPTION_CREATED: 'billing_subscription_created',
  SUBSCRIPTION_UPGRADED: 'billing_subscription_upgraded', 
  SUBSCRIPTION_DOWNGRADED: 'billing_subscription_downgraded',
  SUBSCRIPTION_CANCELLED: 'billing_subscription_cancelled',
  SUBSCRIPTION_REACTIVATED: 'billing_subscription_reactivated',
  SUBSCRIPTION_EXPIRED: 'billing_subscription_expired',
  TRIAL_STARTED: 'billing_trial_started',
  TRIAL_EXTENDED: 'billing_trial_extended',
  TRIAL_EXPIRED: 'billing_trial_expired',
  TRIAL_TO_PAID_UPGRADE: 'billing_trial_to_paid_upgrade',
  PAYMENT_SUCCEEDED: 'billing_payment_succeeded',
  PAYMENT_FAILED: 'billing_payment_failed',
  INVOICE_CREATED: 'billing_invoice_created',
  INVOICE_PAID: 'billing_invoice_paid',
  REFUND_ISSUED: 'billing_refund_issued',
  DOWNGRADE_SCHEDULED: 'billing_downgrade_scheduled',
  DOWNGRADE_CANCELLED: 'billing_downgrade_cancelled',
  PLAN_CHANGE_INITIATED: 'billing_plan_change_initiated',
  PLAN_CHANGE_FAILED: 'billing_plan_change_failed',
} as const

export type BillingActivityType = typeof BILLING_ACTIVITY_TYPES[keyof typeof BILLING_ACTIVITY_TYPES]

/**
 * Log subscription creation
 */
export async function logSubscriptionCreated(
  userId: string, 
  subscriptionTier: string, 
  subscriptionId: string, 
  source: 'web' | 'webhook' = 'web'
) {
  return logBillingActivity({
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
  return logBillingActivity({
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
  return logBillingActivity({
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
  return logBillingActivity({
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
  return logBillingActivity({
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
  return logBillingActivity({
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
  return logBillingActivity({
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
  return logBillingActivity({
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
  return logBillingActivity({
    userId,
    activityType: BILLING_ACTIVITY_TYPES.PAYMENT_SUCCEEDED,
    title: `Payment successful - ${currency.toUpperCase()}${amount.toFixed(2)}`,
    description: `Payment processed successfully`,
    metadata: {
      amount,
      currency,
      invoiceId,
      subscriptionId,
      timestamp: new Date().toISOString()
    },
    source: 'webhook',
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
  return logBillingActivity({
    userId,
    activityType: BILLING_ACTIVITY_TYPES.PAYMENT_FAILED,
    title: `Payment failed - ${currency.toUpperCase()}${amount.toFixed(2)}`,
    description: `Payment failed${reason ? ` - ${reason}` : ''}`,
    metadata: {
      amount,
      currency,
      invoiceId,
      subscriptionId,
      reason,
      timestamp: new Date().toISOString()
    },
    source: 'webhook',
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
  return logBillingActivity({
    userId,
    activityType: BILLING_ACTIVITY_TYPES.TRIAL_TO_PAID_UPGRADE,
    title: `Trial upgraded to ${subscriptionTier}`,
    description: `Free trial converted to ${subscriptionTier} subscription`,
    metadata: {
      subscriptionTier,
      subscriptionId,
      upgradeType: 'trial_to_paid',
      timestamp: new Date().toISOString()
    },
    source,
    relatedEntityType: 'subscription',
    relatedEntityId: subscriptionId
  })
}

/**
 * Log trial start
 */
export async function logTrialStarted(userId: string, trialEndDate: Date) {
  return logBillingActivity({
    userId,
    activityType: BILLING_ACTIVITY_TYPES.TRIAL_STARTED,
    title: 'Trial started',
    description: `Free trial started, expires on ${trialEndDate.toLocaleDateString()}`,
    metadata: {
      trialEndDate: trialEndDate.toISOString(),
      timestamp: new Date().toISOString()
    },
    relatedEntityType: 'trial',
    relatedEntityId: userId
  })
}

/**
 * Log plan change initiated
 */
export async function logPlanChangeInitiated(
  userId: string, 
  fromTier: string, 
  toTier: string, 
  changeType: 'upgrade' | 'downgrade', 
  changeId: string
) {
  return logBillingActivity({
    userId,
    activityType: BILLING_ACTIVITY_TYPES.PLAN_CHANGE_INITIATED,
    title: `Plan ${changeType} initiated: ${fromTier} → ${toTier}`,
    description: `${changeType === 'upgrade' ? 'Upgrade' : 'Downgrade'} process started`,
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