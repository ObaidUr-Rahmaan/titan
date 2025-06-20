import { pgTable, serial, timestamp, varchar, integer, text, boolean, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organizations';
import { users } from './users';
import { subscriptionsPlans } from './subscriptions_plans';

export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  createdTime: timestamp('created_time').defaultNow(),
  updatedTime: timestamp('updated_time').defaultNow(),
  
  // Stripe subscription data
  subscriptionId: varchar('subscription_id').unique().notNull(),
  stripeUserId: varchar('stripe_user_id'), // Stripe customer ID (for backward compatibility)
  stripeCustomerId: varchar('stripe_customer_id'), // Unified Stripe customer ID
  clerkUserId: varchar('clerk_user_id'), // Clerk user ID for easier lookups
  
  // Subscription status and dates
  status: varchar('status').notNull(), // 'active', 'past_due', 'canceled', 'unpaid', 'trialing'
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  trialStart: timestamp('trial_start'),
  trialEnd: timestamp('trial_end'),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  canceledAt: timestamp('canceled_at'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  
  // Plan and pricing
  planId: varchar('plan_id').notNull().references(() => subscriptionsPlans.planId),
  quantity: integer('quantity').default(1), // For seat-based billing
  unitAmount: decimal('unit_amount', { precision: 10, scale: 2 }), // Price per unit in cents
  currency: varchar('currency', { length: 3 }).default('usd'),
  
  // Payment method
  defaultPaymentMethodId: varchar('default_payment_method_id'),
  
  // Contact information
  email: varchar('email').notNull(),
  
  // Ownership - either user or organization (mutually exclusive)
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  organizationId: integer('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  
  // Billing configuration for organizations
  seatLimit: integer('seat_limit'), // Maximum number of seats for organization plans
  usedSeats: integer('used_seats').default(1), // Currently used seats
  autoAddSeats: boolean('auto_add_seats').default(false), // Automatically add seats when needed
  
  // Subscription metadata
  metadata: text('metadata'), // JSON for additional Stripe metadata
  
  // Proration and billing
  prorationBehavior: varchar('proration_behavior').default('create_prorations'), // 'create_prorations', 'none', 'always_invoice'
  billingCycleAnchor: timestamp('billing_cycle_anchor'),
  
  // Tax and discount
  taxPercent: decimal('tax_percent', { precision: 5, scale: 2 }),
  discountId: varchar('discount_id'), // Stripe discount/coupon ID
  
  // Subscription type for easier querying
  subscriptionType: varchar('subscription_type').notNull().default('individual'), // 'individual', 'organization'
  
  // Soft delete
  deletedAt: timestamp('deleted_at'),
  isActive: boolean('is_active').default(true)
});

// Define relationships
export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id]
  }),
  organization: one(organizations, {
    fields: [subscriptions.organizationId],
    references: [organizations.id]
  }),
  plan: one(subscriptionsPlans, {
    fields: [subscriptions.planId],
    references: [subscriptionsPlans.planId]
  })
})); 