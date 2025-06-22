import { createServerClient } from '@/lib/drizzle';
import { type NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import { upgradeUserFromTrialToPaid, expireUserSubscription } from '@/utils/data/user/subscription-status';
import { createDirectClient } from '@/lib/drizzle';
import { subscriptionChanges, subscriptions, organizations, users } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { 
  logSubscriptionCreated, 
  logSubscriptionDowngraded, 
  logSubscriptionCancelled,
  logPaymentSucceeded, 
  logPaymentFailed,
  logTrialToPaidUpgrade 
} from '@/utils/billing-activity-logger';
import { 
  createSubscription, 
  updateSubscription, 
  cancelSubscription,
  type SubscriptionContext,
  type CreateSubscriptionParams,
  type UpdateSubscriptionParams
} from '@/utils/subscription-management';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : undefined;

/**
 * Mark subscription changes as completed when webhook confirms the change
 */
async function markSubscriptionChangeCompleted(
  subscriptionId: string,
  newTier: string,
  userId?: string
): Promise<void> {
  try {
    const db = createDirectClient()
    const { users } = await import('@/db/schema')

    // Get the scheduled change info before updating (for email purposes)
    const [scheduledChange] = await db
      .select({
        id: subscriptionChanges.id,
        fromTier: subscriptionChanges.fromTier,
        toTier: subscriptionChanges.toTier,
        changeType: subscriptionChanges.changeType,
        userId: subscriptionChanges.userId,
      })
      .from(subscriptionChanges)
      .where(
        and(
          eq(subscriptionChanges.stripeSubscriptionId, subscriptionId),
          eq(subscriptionChanges.toTier, newTier),
          eq(subscriptionChanges.changeStatus, 'scheduled')
        )
      )
      .limit(1)

    // Mark any pending/scheduled changes as completed
    await db
      .update(subscriptionChanges)
      .set({
        changeStatus: 'completed',
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(subscriptionChanges.stripeSubscriptionId, subscriptionId),
          eq(subscriptionChanges.toTier, newTier),
          // Only update pending or scheduled changes
          eq(subscriptionChanges.changeStatus, 'scheduled')
        )
      )

    // If we have a userId, also update their subscription tier and clear pending changes
    if (userId) {
      await db
        .update(users)
        .set({
          subscriptionTier: newTier,
          pendingSubscriptionChange: null,
          lastPlanChangeDate: new Date(),
        })
        .where(eq(users.userId, userId))
      
      console.log(`[STRIPE WEBHOOK] User ${userId} subscription tier updated to ${newTier} (scheduled change completed)`)
      
      // Log downgrade completion activity
      if (scheduledChange && scheduledChange.changeType === 'downgrade') {
        await logSubscriptionDowngraded(
          userId,
          scheduledChange.fromTier || 'unknown',
          newTier,
          subscriptionId,
          'webhook'
        );
      }
    }

    console.log(`[STRIPE WEBHOOK] Subscription change marked as completed for ${subscriptionId} -> ${newTier}`)
  } catch (error) {
    console.error(`[STRIPE WEBHOOK] Error marking subscription change as completed:`, error)
  }
}

/**
 * Mark subscription changes as failed when webhook processing fails
 */
async function markSubscriptionChangeFailed(
  subscriptionId: string,
  errorMessage: string
): Promise<void> {
  try {
    const db = createDirectClient()
    const { subscriptionChanges } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')

    // Mark any pending changes for this subscription as failed
    await db
      .update(subscriptionChanges)
      .set({
        changeStatus: 'failed',
        updatedAt: new Date(),
        metadata: JSON.stringify({
          error: errorMessage,
          failedAt: new Date().toISOString()
        })
      })
      .where(eq(subscriptionChanges.stripeSubscriptionId, subscriptionId));
    
    console.log(`[STRIPE WEBHOOK] Marked subscription changes as failed for subscription: ${subscriptionId}`);
  } catch (error) {
    console.error(`[STRIPE WEBHOOK] Error marking subscription change as failed:`, error);
  }
}

export async function POST(req: NextRequest) {
  console.log(`[STRIPE WEBHOOK] Received webhook request at ${new Date().toISOString()}`);
  
  if (!stripe) {
    console.error('[STRIPE WEBHOOK] Missing STRIPE_SECRET_KEY environment variable');
    return NextResponse.json({ error: 'Stripe configuration error' }, { status: 500 });
  }

  try {
    const supabase = await createServerClient();
    const reqText = await req.text();
    console.log(`[STRIPE WEBHOOK] Processing webhook request with payload size: ${reqText.length} bytes`);
    return webhooksHandler(reqText, req, supabase);
  } catch (error) {
    console.error('[STRIPE WEBHOOK] Error in webhook handler:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getCustomerEmail(customerId: string, stripeClient: Stripe): Promise<string | null> {
  try {
    console.log(`[STRIPE WEBHOOK] Fetching customer email for customer ID: ${customerId}`);
    const customer = await stripeClient.customers.retrieve(customerId);
    const email = (customer as Stripe.Customer).email;
    console.log(`[STRIPE WEBHOOK] Customer email fetched: ${email || 'null'}`);
    return email;
  } catch (error) {
    console.error(`[STRIPE WEBHOOK] Error fetching customer with ID ${customerId}:`, error);
    return null;
  }
}

async function handleSubscriptionEvent(
  event: Stripe.Event,
  type: 'created' | 'updated' | 'deleted',
  supabase: SupabaseClient
) {
  console.log(`[STRIPE WEBHOOK] Processing subscription ${type} event: ${event.id}`);
  
  if (!stripe) {
    console.error('[STRIPE WEBHOOK] Missing STRIPE_SECRET_KEY environment variable');
    return NextResponse.json({ error: 'Stripe configuration error' }, { status: 500 });
  }

  const subscription = event.data.object as Stripe.Subscription;
  console.log(`[STRIPE WEBHOOK] Subscription ID: ${subscription.id}, Status: ${subscription.status}`);
  
  // Determine subscription context (individual or organization)
  const context: SubscriptionContext = subscription.metadata?.organizationId ? 'organization' : 'individual';
  const contextId = subscription.metadata?.organizationId || subscription.metadata?.userId;
  
  console.log(`[STRIPE WEBHOOK] Subscription context: ${context}, Context ID: ${contextId}`);
  
  if (!contextId) {
    console.error(`[STRIPE WEBHOOK] Missing context ID in subscription metadata for ${subscription.id}`);
    return NextResponse.json({
      status: 400,
      error: 'Missing context ID in subscription metadata',
    });
  }

  const customerEmail = await getCustomerEmail(subscription.customer as string, stripe);

  if (!customerEmail) {
    console.error(`[STRIPE WEBHOOK] Customer email could not be fetched for subscription ${subscription.id}`);
    return NextResponse.json({
      status: 500,
      error: 'Customer email could not be fetched',
    });
  }

  console.log(`[STRIPE WEBHOOK] Processing ${context} subscription with ID: ${subscription.id}`);

  try {
    // Use subscription management service for organization/individual subscriptions
    if (type === 'deleted') {
      console.log(`[STRIPE WEBHOOK] Cancelling ${context} subscription: ${subscription.id}`);
      
      const result = await cancelSubscription(subscription.id, true);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to cancel subscription');
      }
      
      console.log(`[STRIPE WEBHOOK] Successfully cancelled ${context} subscription for ${contextId}`);
      
    } else if (type === 'created') {
      console.log(`[STRIPE WEBHOOK] Creating ${context} subscription: ${subscription.id}`);
      
      const priceId = subscription.items.data[0]?.price.id;
      const planId = subscription.metadata?.planId || priceId;
      
      const createParams: CreateSubscriptionParams = {
        context,
        subscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        planId,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        quantity: subscription.items.data[0]?.quantity || 1,
        email: customerEmail,
      };
      
      // Add context-specific parameters
      if (context === 'organization') {
        createParams.organizationId = parseInt(contextId);
        createParams.seatLimit = subscription.metadata?.seatLimit ? parseInt(subscription.metadata.seatLimit) : 10;
      } else {
        createParams.clerkUserId = contextId;
      }
      
      const result = await createSubscription(createParams);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create subscription');
      }
      
      console.log(`[STRIPE WEBHOOK] Successfully created ${context} subscription for ${contextId}`);
      
    } else if (type === 'updated') {
      console.log(`[STRIPE WEBHOOK] Updating ${context} subscription: ${subscription.id}`);
      
      const planId = subscription.metadata?.planId || subscription.items.data[0]?.price.id;
      
      const updateParams: UpdateSubscriptionParams = {
        subscriptionId: subscription.id,
        status: subscription.status,
        planId,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        quantity: subscription.items.data[0]?.quantity || 1,
      };
      
      // Add organization-specific parameters
      if (context === 'organization' && subscription.metadata?.seatLimit) {
        updateParams.seatLimit = parseInt(subscription.metadata.seatLimit);
      }
      
      const result = await updateSubscription(updateParams);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update subscription');
      }
      
      console.log(`[STRIPE WEBHOOK] Successfully updated ${context} subscription for ${contextId}`);
    }

  } catch (serviceError) {
    console.error(`[STRIPE WEBHOOK] Error in subscription management service:`, serviceError);
    return NextResponse.json({
      status: 500,
      error: `Error processing ${context} subscription ${type}`,
    });
  }

  // Log billing activity based on subscription type and status
  try {
    const userId = subscription.metadata?.userId || customerEmail;
    const planName = subscription.items.data[0]?.price.nickname || 'Unknown Plan';
    
    if (type === 'created') {
      await logSubscriptionCreated(userId, planName, subscription.id, 'webhook');
      
      // Check if this is a trial to paid upgrade
      if (subscription.status === 'active' && subscription.trial_end) {
        await logTrialToPaidUpgrade(userId, planName, subscription.id, 'webhook');
        await upgradeUserFromTrialToPaid(userId, planName, subscription.id);
      }
    } else if (type === 'deleted') {
      await logSubscriptionCancelled(userId, planName, subscription.id, undefined, 'webhook');
    } else if (type === 'updated') {
      // Handle subscription updates (upgrades/downgrades)
      if (subscription.status === 'active') {
        // This could be an upgrade or downgrade - would need previous state to determine
        console.log(`[STRIPE WEBHOOK] Subscription updated for user ${userId} to plan ${planName}`);
      }
    }
  } catch (activityError) {
    console.error(`[STRIPE WEBHOOK] Error logging billing activity:`, activityError);
    // Don't fail the webhook for logging errors
  }

  console.log(`[STRIPE WEBHOOK] Subscription ${type} processed successfully for ID: ${subscription.id}`);
  return NextResponse.json({
    status: 200,
    message: `Subscription ${type} success`,
  });
}

async function handleInvoiceEvent(
  event: Stripe.Event,
  status: 'succeeded' | 'failed',
  supabase: SupabaseClient
) {
  console.log(`[STRIPE WEBHOOK] Processing invoice ${status} event: ${event.id}`);
  
  if (!stripe) {
    console.error('[STRIPE WEBHOOK] Missing STRIPE_SECRET_KEY environment variable');
    return NextResponse.json({ error: 'Stripe configuration error' }, { status: 500 });
  }

  const invoice = event.data.object as Stripe.Invoice;
  console.log(`[STRIPE WEBHOOK] Invoice ID: ${invoice.id}, Status: ${invoice.status}`);
  
  const customerEmail = await getCustomerEmail(invoice.customer as string, stripe);

  if (!customerEmail) {
    console.error(`[STRIPE WEBHOOK] Customer email could not be fetched for invoice ${invoice.id}`);
    return NextResponse.json({
      status: 500,
      error: 'Customer email could not be fetched',
    });
  }

  const invoiceData = {
    invoice_id: invoice.id,
    subscription_id: invoice.subscription as string,
    amount_paid: status === 'succeeded' ? invoice.amount_paid / 100 : undefined,
    amount_due: status === 'failed' ? invoice.amount_due / 100 : undefined,
    currency: invoice.currency,
    status,
    user_id: invoice.metadata?.userId,
    email: customerEmail,
  };

  console.log(`[STRIPE WEBHOOK] Inserting invoice data:`, invoiceData);

  const { data, error } = await supabase.from('invoices').insert([invoiceData]);

  if (error) {
    console.error(`[STRIPE WEBHOOK] Error inserting invoice (payment ${status}):`, error);
    return NextResponse.json({
      status: 500,
      error: `Error inserting invoice (payment ${status})`,
    });
  }

  // Log billing activity for payment events
  try {
    const userId = invoice.metadata?.userId || customerEmail;
    const amount = status === 'succeeded' ? invoice.amount_paid : invoice.amount_due || 0;
    const currency = invoice.currency;
    
    if (status === 'succeeded') {
      await logPaymentSucceeded(userId, amount, currency, invoice.id, invoice.subscription as string);
    } else if (status === 'failed') {
      await logPaymentFailed(userId, amount, currency, invoice.id, 'Payment failed', invoice.subscription as string);
    }
  } catch (activityError) {
    console.error(`[STRIPE WEBHOOK] Error logging payment activity:`, activityError);
    // Don't fail the webhook for logging errors
  }

  console.log(`[STRIPE WEBHOOK] Invoice payment ${status} recorded successfully for ID: ${invoice.id}`);
  return NextResponse.json({
    status: 200,
    message: `Invoice payment ${status}`,
    data,
  });
}

async function handleCheckoutSessionCompleted(event: Stripe.Event, supabase: SupabaseClient) {
  console.log(`[STRIPE WEBHOOK] Processing checkout.session.completed event: ${event.id}`);
  
  if (!stripe) {
    console.error('[STRIPE WEBHOOK] Missing STRIPE_SECRET_KEY environment variable');
    return NextResponse.json({ error: 'Stripe configuration error' }, { status: 500 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const metadata: any = session?.metadata;
  
  console.log(`[STRIPE WEBHOOK] Checkout session ID: ${session.id}, Customer: ${session.customer}`);
  console.log(`[STRIPE WEBHOOK] Session metadata:`, metadata);

  if (metadata?.subscription === 'true') {
    // This is for subscription payments
    const subscriptionId = session.subscription;
    console.log(`[STRIPE WEBHOOK] Processing subscription payment. Subscription ID: ${subscriptionId}`);
    
    try {
      console.log(`[STRIPE WEBHOOK] Updating subscription metadata for ID: ${subscriptionId}`);
      await stripe.subscriptions.update(subscriptionId as string, { metadata });

      console.log(`[STRIPE WEBHOOK] Updating invoice user_id to ${metadata?.userId} for email: ${metadata?.email}`);
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({ user_id: metadata?.userId })
        .eq('email', metadata?.email);
      if (invoiceError) {
        console.error(`[STRIPE WEBHOOK] Error updating invoice:`, invoiceError);
        throw new Error('Error updating invoice');
      }

      console.log(`[STRIPE WEBHOOK] Updating user subscription to ${session.id} for user ID: ${metadata?.userId}`);
      const { error: userError } = await supabase
        .from('user')
        .update({ subscription: session.id })
        .eq('user_id', metadata?.userId);
      if (userError) {
        console.error(`[STRIPE WEBHOOK] Error updating user subscription:`, userError);
        throw new Error('Error updating user subscription');
      }

      console.log(`[STRIPE WEBHOOK] Subscription metadata updated successfully for session: ${session.id}`);
      return NextResponse.json({
        status: 200,
        message: 'Subscription metadata updated successfully',
      });
    } catch (error) {
      console.error('[STRIPE WEBHOOK] Error updating subscription metadata:', error);
      return NextResponse.json({
        status: 500,
        error: 'Error updating subscription metadata',
      });
    }
  } else {
    // This is for one-time payments
    const dateTime = new Date(session.created * 1000).toISOString();
    console.log(`[STRIPE WEBHOOK] Processing one-time payment for session: ${session.id}`);
    
    try {
      console.log(`[STRIPE WEBHOOK] Fetching user data for user ID: ${metadata?.userId}`);
      const { data: user, error: userError } = await supabase
        .from('user')
        .select('*')
        .eq('user_id', metadata?.userId);
      if (userError) {
        console.error(`[STRIPE WEBHOOK] Error fetching user:`, userError);
        throw new Error('Error fetching user');
      }

      const paymentData = {
        user_id: metadata?.userId,
        stripe_id: session.id,
        email: metadata?.email,
        amount: session.amount_total! / 100,
        customer_details: JSON.stringify(session.customer_details),
        payment_intent: session.payment_intent,
        payment_time: dateTime,
        payment_date: dateTime,
        currency: session.currency,
      };

      console.log(`[STRIPE WEBHOOK] Inserting payment data with fields:`, Object.keys(paymentData));
      console.log(`[STRIPE WEBHOOK] Payment data values:`, paymentData);
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .insert([paymentData]);
      if (paymentsError) {
        console.error(`[STRIPE WEBHOOK] Error inserting payment:`, paymentsError);
        throw new Error('Error inserting payment');
      }
      
      console.log(`[STRIPE WEBHOOK] Payment recorded successfully for session: ${session.id}`);
      
      return NextResponse.json({
        status: 200,
        message: 'Payment recorded successfully',
      });
    } catch (error) {
      console.error('[STRIPE WEBHOOK] Error handling checkout session:', error);
      return NextResponse.json({
        status: 500,
        error,
      });
    }
  }
}

async function handlePaymentIntentSucceeded(event: Stripe.Event, supabase: SupabaseClient) {
  console.log(`[STRIPE WEBHOOK] Processing payment_intent.succeeded event: ${event.id}`);
  
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  console.log(`[STRIPE WEBHOOK] Payment intent ID: ${paymentIntent.id}, Status: ${paymentIntent.status}`);
  
  // We don't need to do anything special here as the checkout.session.completed event
  // will handle the payment recording. This handler is just to acknowledge the event.
  return NextResponse.json({
    status: 200,
    message: 'Payment intent succeeded acknowledged',
  });
}

async function handleRefund(event: Stripe.Event, supabase: SupabaseClient) {
  console.log(`[STRIPE WEBHOOK] Processing charge.refunded event: ${event.id}`);
  
  const charge = event.data.object as Stripe.Charge;
  console.log(`[STRIPE WEBHOOK] Charge ID: ${charge.id}, Amount refunded: ${charge.amount_refunded / 100}`);
  
  // Extract refund ID from the charge
  const refundId = charge.refunds?.data[0]?.id || `refund_${charge.id}`;
  
  try {
    // Check if this refund is already recorded in our database
    console.log(`[STRIPE WEBHOOK] Checking if refund with ID ${refundId} already exists`);
    const { data: existingRefund, error: existingRefundError } = await supabase
      .from('refunds')
      .select('*')
      .eq('refund_id', refundId)
      .maybeSingle();
    
    if (existingRefund) {
      console.log(`[STRIPE WEBHOOK] Refund with ID ${refundId} already exists, skipping creation`);
      return NextResponse.json({
        status: 200,
        message: 'Refund already exists in the database',
      });
    }
    
    // First, try to find the payment in the payments table
    console.log(`[STRIPE WEBHOOK] Searching for payment with payment_intent: ${charge.payment_intent}`);
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('payment_intent', charge.payment_intent)
      .maybeSingle();
    
    // If not found in payments, try to find in subscriptions
    let paymentSource;
    let userId;
    let paymentId;
    
    if (payment) {
      console.log(`[STRIPE WEBHOOK] Found payment in payments table: ${payment.id}`);
      paymentSource = 'payment';
      userId = payment.user_id;
      paymentId = payment.id;
    } else {
      console.log(`[STRIPE WEBHOOK] Payment not found in payments table, checking subscriptions...`);
      
      // Get invoice from payment intent if available
      let invoiceId = null;
      if (charge.invoice) {
        console.log(`[STRIPE WEBHOOK] Charge has invoice ID: ${charge.invoice}`);
        invoiceId = charge.invoice;
      }
      
      // Try to find in subscriptions using invoice ID or customer ID
      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('stripe_user_id', charge.customer)
        .maybeSingle();
      
      if (subscription) {
        console.log(`[STRIPE WEBHOOK] Found subscription for customer: ${charge.customer}`);
        paymentSource = 'subscription';
        userId = subscription.user_id;
        paymentId = subscription.id;
      } else {
        console.log(`[STRIPE WEBHOOK] No record found in payments or subscriptions tables`);
        return NextResponse.json({
          status: 404,
          error: 'No payment or subscription found for this refund',
        });
      }
    }
    
    // Create a refund record
    const refundData = {
      payment_id: paymentId,
      user_id: userId,
      refund_id: refundId,
      amount: charge.amount_refunded / 100,
      currency: charge.currency,
      refund_date: new Date().toISOString(),
      status: 'completed',
      reason: charge.refunds?.data[0]?.reason || 'requested_by_customer',
      metadata: JSON.stringify({
        charge_id: charge.id,
        payment_intent: charge.payment_intent,
        payment_source: paymentSource,
        customer: charge.customer,
        invoice: charge.invoice,
        event_id: event.id,
        event_type: event.type
      })
    };
    
    console.log(`[STRIPE WEBHOOK] Recording refund data:`, refundData);
    
    const { data: refundResult, error: refundError } = await supabase
      .from('refunds')
      .insert([refundData]);
    
    if (refundError) {
      console.error(`[STRIPE WEBHOOK] Error recording refund:`, refundError);
      return NextResponse.json({
        status: 500,
        error: 'Error recording refund',
      });
    }
    
    console.log(`[STRIPE WEBHOOK] Refund recorded successfully for charge: ${charge.id}`);
    return NextResponse.json({
      status: 200,
      message: 'Refund recorded successfully',
    });
  } catch (error) {
    console.error('[STRIPE WEBHOOK] Error handling refund:', error);
    return NextResponse.json({
      status: 500,
      error: 'Error processing refund',
    });
  }
}

// Add a new handler for refund.updated events
async function handleRefundUpdated(event: Stripe.Event, supabase: SupabaseClient) {
  console.log(`[STRIPE WEBHOOK] Processing refund.updated event: ${event.id}`);
  
  const refund = event.data.object as Stripe.Refund;
  console.log(`[STRIPE WEBHOOK] Refund ID: ${refund.id}, Status: ${refund.status}`);
  
  try {
    // Find the refund in our database
    const { data: existingRefund, error: findError } = await supabase
      .from('refunds')
      .select('*')
      .eq('refund_id', refund.id)
      .maybeSingle();
    
    if (existingRefund) {
      // Update the existing refund
      console.log(`[STRIPE WEBHOOK] Updating existing refund with ID: ${existingRefund.id}`);
      
      const { error: updateError } = await supabase
        .from('refunds')
        .update({
          status: refund.status,
          metadata: JSON.stringify({
            ...JSON.parse(existingRefund.metadata || '{}'),
            last_updated: new Date().toISOString(),
            stripe_status: refund.status,
            event_id: event.id,
            event_type: event.type
          })
        })
        .eq('id', existingRefund.id);
      
      if (updateError) {
        console.error(`[STRIPE WEBHOOK] Error updating refund:`, updateError);
        return NextResponse.json({
          status: 500,
          error: 'Error updating refund',
        });
      }
      
      console.log(`[STRIPE WEBHOOK] Refund updated successfully for ID: ${refund.id}`);
      return NextResponse.json({
        status: 200,
        message: 'Refund updated successfully',
      });
    } else {
      // This refund doesn't exist in our system yet, but we received an update
      
      // Early exit if there's a charge.refunded event already in progress for this refund
      // This helps prevent race conditions with close timing between events
      console.log(`[STRIPE WEBHOOK] Checking recent refunds for ID ${refund.id}`);
      const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();
      const { data: recentRefunds } = await supabase
        .from('refunds')
        .select('*')
        .gt('created_time', fiveSecondsAgo);
        
      if (recentRefunds && recentRefunds.length > 0) {
        console.log(`[STRIPE WEBHOOK] Found ${recentRefunds.length} recent refunds, possible race condition. Waiting before creating new refund.`);
        return NextResponse.json({
          status: 202,
          message: 'Possible race condition detected. Skipping to prevent duplicates.',
        });
      }
      
      console.log(`[STRIPE WEBHOOK] Refund not found in database, fetching charge data...`);
      
      if (!stripe) {
        console.error('[STRIPE WEBHOOK] Missing STRIPE_SECRET_KEY environment variable');
        return NextResponse.json({ error: 'Stripe configuration error' }, { status: 500 });
      }
      
      // Get the charge ID to locate the payment
      const chargeId = refund.charge;
      if (!chargeId) {
        console.error(`[STRIPE WEBHOOK] No charge ID found for refund: ${refund.id}`);
        return NextResponse.json({
          status: 400,
          error: 'No charge ID associated with this refund',
        });
      }
      
      // Create a fake charge.refunded event and process it
      const chargeEvent = {
        id: `synthetic_${event.id}`,
        type: 'charge.refunded',
        data: {
          object: await stripe.charges.retrieve(chargeId as string)
        }
      } as unknown as Stripe.Event;
      
      console.log(`[STRIPE WEBHOOK] Created synthetic charge.refunded event for charge: ${chargeId}`);
      return await handleRefund(chargeEvent, supabase);
    }
  } catch (error) {
    console.error('[STRIPE WEBHOOK] Error handling refund update:', error);
    return NextResponse.json({
      status: 500,
      error: 'Error processing refund update',
    });
  }
}

// Add this new handler function after handleRefundUpdated and before webhooksHandler
async function handleRefundFailed(event: Stripe.Event, supabase: SupabaseClient) {
  console.log(`[STRIPE WEBHOOK] Processing refund.failed event: ${event.id}`);
  
  const refund = event.data.object as Stripe.Refund;
  console.log(`[STRIPE WEBHOOK] Refund ID: ${refund.id}, Status: ${refund.status}`);
  
  try {
    // Find the refund in our database - try multiple ways to find it
    console.log(`[STRIPE WEBHOOK] Searching for refund with Stripe ID: ${refund.id}`);
    
    // First try with the exact ID
    let { data: existingRefund, error: findError } = await supabase
      .from('refunds')
      .select('*')
      .eq('refund_id', refund.id)
      .maybeSingle();
    
    // If not found, try with the prefixed ID (some might be stored with 'refund_' prefix)
    if (!existingRefund) {
      console.log(`[STRIPE WEBHOOK] Not found with exact ID, trying with custom prefix`);
      ({ data: existingRefund, error: findError } = await supabase
        .from('refunds')
        .select('*')
        .eq('refund_id', `refund_${refund.charge}`)
        .maybeSingle());
    }
    
    // If still not found, try looking for the charge ID in metadata
    if (!existingRefund) {
      console.log(`[STRIPE WEBHOOK] Trying to find by charge ID: ${refund.charge}`);
      const { data: allRefunds } = await supabase.from('refunds').select('*');
      
      if (allRefunds && allRefunds.length > 0) {
        existingRefund = allRefunds.find(r => {
          try {
            const metadata = JSON.parse(r.metadata || '{}');
            return metadata.charge_id === refund.charge;
          } catch {
            return false;
          }
        });
      }
    }
    
    if (existingRefund) {
      // Update the existing refund
      console.log(`[STRIPE WEBHOOK] Updating existing refund with ID: ${existingRefund.id} to failed/canceled status`);
      
      const { error: updateError } = await supabase
        .from('refunds')
        .update({
          status: 'cancelled', // Using consistent spelling in the database
          reason: refund.failure_reason || 'canceled_by_user',
          metadata: JSON.stringify({
            ...JSON.parse(existingRefund.metadata || '{}'),
            last_updated: new Date().toISOString(),
            stripe_status: refund.status, 
            cancellation_time: new Date().toISOString(),
            event_id: event.id,
            event_type: event.type,
            stripe_refund_id: refund.id // Store the Stripe refund ID explicitly
          })
        })
        .eq('id', existingRefund.id);
      
      if (updateError) {
        console.error(`[STRIPE WEBHOOK] Error updating refund:`, updateError);
        return NextResponse.json({
          status: 500,
          error: 'Error updating refund status to cancelled',
        });
      }
      
      console.log(`[STRIPE WEBHOOK] Refund status updated to cancelled for ID: ${refund.id}`);
      return NextResponse.json({
        status: 200,
        message: 'Refund status updated to cancelled',
      });
    } else {
      console.log(`[STRIPE WEBHOOK] Refund not found in database for failed event, creating simple record`);
      
      // Create a minimal record if we can't find an existing one
      if (refund.charge) {
        const refundData = {
          refund_id: refund.id,
          amount: refund.amount / 100,
          currency: refund.currency,
          status: 'cancelled',
          reason: refund.failure_reason || 'canceled_by_user',
          refund_date: new Date().toISOString(),
          metadata: JSON.stringify({
            charge_id: refund.charge,
            payment_intent: refund.payment_intent,
            event_id: event.id,
            event_type: event.type,
            original_refund_status: refund.status
          })
        };
        
        const { error: insertError } = await supabase
          .from('refunds')
          .insert([refundData]);
          
        if (insertError) {
          console.error(`[STRIPE WEBHOOK] Error creating cancelled refund record:`, insertError);
        } else {
          console.log(`[STRIPE WEBHOOK] Created new cancelled refund record for ID: ${refund.id}`);
        }
      }
      
      return NextResponse.json({
        status: 200,
        message: 'Refund failure recorded',
      });
    }
  } catch (error) {
    console.error('[STRIPE WEBHOOK] Error handling refund failure:', error);
    return NextResponse.json({
      status: 500,
      error: 'Error processing refund failure',
    });
  }
}

// Add this new handler for refund.created events
async function handleRefundCreated(event: Stripe.Event, supabase: SupabaseClient) {
  console.log(`[STRIPE WEBHOOK] Processing refund.created event: ${event.id}`);
  
  const refund = event.data.object as Stripe.Refund;
  console.log(`[STRIPE WEBHOOK] Refund ID: ${refund.id}, Amount: ${refund.amount / 100}`);
  
  // Check if we already have this refund in our database
  const { data: existingRefund } = await supabase
    .from('refunds')
    .select('*')
    .or(`refund_id.eq.${refund.id},refund_id.eq.refund_${refund.charge}`)
    .maybeSingle();
    
  if (existingRefund) {
    console.log(`[STRIPE WEBHOOK] Refund already exists in database, skipping creation`);
    return NextResponse.json({
      status: 200,
      message: 'Refund already recorded',
    });
  }
  
  // We'll let the charge.refunded event handle the actual creation in most cases
  // This is just a placeholder to acknowledge the event
  console.log(`[STRIPE WEBHOOK] Refund creation will be handled by charge.refunded event`);
  return NextResponse.json({
    status: 200,
    message: 'Refund creation event received',
  });
}

// Add this new handler after handleRefundFailed
async function handleChargeRefundUpdated(event: Stripe.Event, supabase: SupabaseClient) {
  console.log(`[STRIPE WEBHOOK] Processing charge.refund.updated event: ${event.id}`);
  
  // For charge.refund.updated events, the structure is different
  const refund = event.data.object as any; // Using any because the type here is non-standard
  
  // Extract the refund ID - may need to check different properties depending on the event structure
  console.log(`[STRIPE WEBHOOK] Refund object:`, refund);
  
  // Try to get refund ID from different possible locations
  let refundId = refund.id;
  if (!refundId && refund.refund) {
    refundId = refund.refund;
  }
  if (!refundId && refund.refunds && refund.refunds.data && refund.refunds.data.length > 0) {
    refundId = refund.refunds.data[0].id;
  }
  
  console.log(`[STRIPE WEBHOOK] Extracted refund ID: ${refundId}`);
  
  if (!refundId) {
    console.error(`[STRIPE WEBHOOK] Could not extract refund ID from event`);
    return NextResponse.json({
      status: 400,
      error: 'Could not extract refund ID from event',
    });
  }
  
  try {
    // Search for the refund in our database with more flexible matching
    console.log(`[STRIPE WEBHOOK] Searching for refund with ID: ${refundId}`);
    
    // Do a broader search to find the refund by checking both the refund_id field
    // and also looking in the metadata JSON where we might have stored the ID
    const { data: refunds, error: searchError } = await supabase
      .from('refunds')
      .select('*');
    
    if (searchError) {
      console.error(`[STRIPE WEBHOOK] Error searching for refunds:`, searchError);
      return NextResponse.json({
        status: 500,
        error: 'Error searching for refunds',
      });
    }
    
    // Find the matching refund either by refund_id or in metadata
    let existingRefund = null;
    if (refunds && refunds.length > 0) {
      console.log(`[STRIPE WEBHOOK] Found ${refunds.length} total refunds, checking for match`);
      
      // First try direct match on refund_id
      existingRefund = refunds.find(r => r.refund_id === refundId);
      
      // If not found, try looking in metadata
      if (!existingRefund) {
        existingRefund = refunds.find(r => {
          try {
            const metadata = JSON.parse(r.metadata || '{}');
            return metadata.charge_id === refund.id || 
                   metadata.refund_id === refundId ||
                   r.metadata.includes(refundId);
          } catch (e) {
            return false;
          }
        });
      }
    }
    
    if (existingRefund) {
      console.log(`[STRIPE WEBHOOK] Found matching refund with ID: ${existingRefund.id}`);
      
      // Determine the new status
      let newStatus = 'updated';
      if (refund.status === 'failed' || refund.status === 'canceled') {
        newStatus = 'failed';
      } else if (refund.status === 'succeeded') {
        newStatus = 'completed';
      } else if (refund.status) {
        newStatus = refund.status;
      }
      
      // Update the existing refund
      console.log(`[STRIPE WEBHOOK] Updating existing refund status to: ${newStatus}`);
      
      const { error: updateError } = await supabase
        .from('refunds')
        .update({
          status: newStatus,
          metadata: JSON.stringify({
            ...JSON.parse(existingRefund.metadata || '{}'),
            last_updated: new Date().toISOString(),
            event_id: event.id,
            event_type: event.type,
            charge_refund_updated: true
          })
        })
        .eq('id', existingRefund.id);
      
      if (updateError) {
        console.error(`[STRIPE WEBHOOK] Error updating refund:`, updateError);
        return NextResponse.json({
          status: 500,
          error: 'Error updating refund',
        });
      }
      
      console.log(`[STRIPE WEBHOOK] Refund updated successfully for ID: ${existingRefund.id}`);
      return NextResponse.json({
        status: 200,
        message: 'Refund updated successfully',
      });
    } else {
      console.log(`[STRIPE WEBHOOK] No matching refund found for ID: ${refundId}`);
      
      // We couldn't find a matching refund record
      // Since this is an update event, not having a record is unusual
      // Let's log additional information to help debug
      console.log(`[STRIPE WEBHOOK] Event data:`, event.data);
      
      return NextResponse.json({
        status: 404,
        message: 'No matching refund found in database. This may indicate an issue with event ordering.',
      });
    }
  } catch (error) {
    console.error('[STRIPE WEBHOOK] Error handling charge.refund.updated:', error);
    return NextResponse.json({
      status: 500,
      error: 'Error processing charge.refund.updated',
    });
  }
}

async function webhooksHandler(
  reqText: string,
  request: NextRequest,
  supabase: SupabaseClient
): Promise<NextResponse> {
  if (!stripe) {
    console.error('[STRIPE WEBHOOK] Missing STRIPE_SECRET_KEY environment variable');
    return NextResponse.json({ error: 'Stripe configuration error' }, { status: 500 });
  }

  // Get the webhook secret
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.error('[STRIPE WEBHOOK] Missing STRIPE_WEBHOOK_SECRET environment variable');
    return NextResponse.json(
      { error: 'Webhook secret not configured properly' },
      { status: 500 }
    );
  }

  // Get the signature from the header
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('[STRIPE WEBHOOK] Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing signature header' }, { status: 400 });
  }

  // Construct the event
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(reqText, signature, secret);
    console.log(`[STRIPE WEBHOOK] Successfully constructed event: ${event.id}, Type: ${event.type}`);
  } catch (error: any) {
    console.error('[STRIPE WEBHOOK] Error constructing webhook event:', error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  console.log(`[STRIPE WEBHOOK] Received event type: ${event.type}`);

  // Handle the events
  try {
    // Use type assertion to handle event types not included in Stripe's type definitions
    const eventType = event.type as string;
    
    switch (eventType) {
      case 'customer.subscription.created':
        console.log(`[STRIPE WEBHOOK] Processing customer.subscription.created event: ${event.id}`);
        return await handleSubscriptionEvent(event, 'created', supabase);
      case 'customer.subscription.updated':
        console.log(`[STRIPE WEBHOOK] Processing customer.subscription.updated event: ${event.id}`);
        return await handleSubscriptionEvent(event, 'updated', supabase);
      case 'customer.subscription.deleted':
        console.log(`[STRIPE WEBHOOK] Processing customer.subscription.deleted event: ${event.id}`);
        return await handleSubscriptionEvent(event, 'deleted', supabase);
      case 'invoice.payment_succeeded':
        console.log(`[STRIPE WEBHOOK] Processing invoice.payment_succeeded event: ${event.id}`);
        return await handleInvoiceEvent(event, 'succeeded', supabase);
      case 'invoice.payment_failed':
        console.log(`[STRIPE WEBHOOK] Processing invoice.payment_failed event: ${event.id}`);
        return await handleInvoiceEvent(event, 'failed', supabase);
      case 'checkout.session.completed':
        console.log(`[STRIPE WEBHOOK] Processing checkout.session.completed event: ${event.id}`);
        return await handleCheckoutSessionCompleted(event, supabase);
      case 'payment_intent.succeeded':
        console.log(`[STRIPE WEBHOOK] Processing payment_intent.succeeded event: ${event.id}`);
        return await handlePaymentIntentSucceeded(event, supabase);
      case 'charge.refunded':
        console.log(`[STRIPE WEBHOOK] Processing charge.refunded event: ${event.id}`);
        return await handleRefund(event, supabase);
      case 'refund.updated':
        console.log(`[STRIPE WEBHOOK] Processing refund.updated event: ${event.id}`);
        return await handleRefundUpdated(event, supabase);
      case 'refund.failed':
        console.log(`[STRIPE WEBHOOK] Processing refund.failed event: ${event.id}`);
        return await handleRefundFailed(event, supabase);
      case 'charge.refund.updated':
        console.log(`[STRIPE WEBHOOK] Processing charge.refund.updated event: ${event.id}`);
        return await handleChargeRefundUpdated(event, supabase);
      case 'refund.created':
        console.log(`[STRIPE WEBHOOK] Processing refund.created event: ${event.id}`);
        return await handleRefundCreated(event, supabase);
      default:
        console.log(`[STRIPE WEBHOOK] Unhandled event type: ${eventType}`);
        return NextResponse.json(
          { received: true, event: eventType },
          { status: 200 }
        );
    }
  } catch (error) {
    console.error(`[STRIPE WEBHOOK] Error processing event ${event.type}:`, error);
    return NextResponse.json(
      { error: 'Error processing event' },
      { status: 500 }
    );
  }
}
