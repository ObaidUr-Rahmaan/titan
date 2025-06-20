import { pgTable, serial, timestamp, varchar, text, boolean, integer, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { subscriptions } from './subscriptions';

export const subscriptionsPlans = pgTable('subscriptions_plans', {
  id: serial('id').primaryKey(),
  createdTime: timestamp('created_time').defaultNow(),
  updatedTime: timestamp('updated_time').defaultNow(),
  
  // Plan identification
  planId: varchar('plan_id').unique().notNull(), // Stripe price ID
  stripePriceId: varchar('stripe_price_id').unique(), // Alternative Stripe price ID field
  stripeProductId: varchar('stripe_product_id'), // Stripe product ID
  
  // Plan details
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  shortDescription: varchar('short_description', { length: 200 }),
  
  // Pricing
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(), // Price in cents
  currency: varchar('currency', { length: 3 }).notNull().default('usd'),
  interval: varchar('interval').notNull(), // 'month', 'year', 'week', 'day'
  intervalCount: integer('interval_count').default(1), // Every X intervals
  
  // Plan type and targeting
  planType: varchar('plan_type').notNull().default('individual'), // 'individual', 'organization', 'both'
  tier: varchar('tier'), // 'basic', 'pro', 'business', 'enterprise'
  
  // Seat-based billing for organizations
  isPerSeat: boolean('is_per_seat').default(false),
  minSeats: integer('min_seats').default(1),
  maxSeats: integer('max_seats'), // null for unlimited
  seatPrice: decimal('seat_price', { precision: 10, scale: 2 }), // Price per additional seat
  
  // Trial configuration
  trialPeriodDays: integer('trial_period_days').default(0),
  hasFreeTrial: boolean('has_free_trial').default(false),
  
  // Plan features (JSON)
  features: text('features'), // JSON array of feature strings
  featureLimits: text('feature_limits'), // JSON object with feature limits
  
  // Organization-specific limits
  memberLimit: integer('member_limit'), // Max members for organization plans
  projectLimit: integer('project_limit'), // Max projects
  storageLimit: integer('storage_limit'), // Storage limit in GB
  apiRateLimit: integer('api_rate_limit'), // API calls per hour
  
  // Plan status and visibility
  isActive: boolean('is_active').default(true),
  isPublic: boolean('is_public').default(true), // Show on pricing page
  isLegacy: boolean('is_legacy').default(false), // Legacy plan (existing users only)
  
  // Ordering and display
  sortOrder: integer('sort_order').default(0),
  recommended: boolean('recommended').default(false),
  popular: boolean('popular').default(false),
  
  // Plan metadata
  metadata: text('metadata'), // JSON for additional data
  
  // Billing configuration
  billingScheme: varchar('billing_scheme').default('per_unit'), // 'per_unit', 'tiered'
  tieredPricing: text('tiered_pricing'), // JSON for tiered pricing structure
  
  // Soft delete
  deletedAt: timestamp('deleted_at'),
  isDeleted: boolean('is_deleted').default(false)
});

// Define relationships
export const subscriptionsPlansRelations = relations(subscriptionsPlans, ({ many }) => ({
  subscriptions: many(subscriptions)
})); 