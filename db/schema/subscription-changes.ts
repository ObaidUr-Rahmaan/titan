import { pgTable, uuid, varchar, timestamp, decimal, text, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

// Enum for change types
export const changeTypeEnum = pgEnum('change_type', ['upgrade', 'downgrade', 'cancellation', 'reactivation']);

// Enum for change status  
export const changeStatusEnum = pgEnum('change_status', ['pending', 'scheduled', 'completed', 'failed', 'cancelled', 'aborted']);

export const subscriptionChanges = pgTable('subscription_changes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id').notNull().references(() => users.userId),
  stripeSubscriptionId: varchar('stripe_subscription_id').notNull(),
  fromTier: varchar('from_tier', { length: 50 }), // 'trial', 'basic', 'pro', 'business'
  toTier: varchar('to_tier', { length: 50 }).notNull(), // 'basic', 'pro', 'business', 'cancelled'
  changeType: changeTypeEnum('change_type').notNull(),
  changeStatus: changeStatusEnum('change_status').notNull().default('pending'),
  effectiveDate: timestamp('effective_date').notNull(),
  prorationAmount: decimal('proration_amount', { precision: 10, scale: 2 }), // Can be negative for credits
  reason: varchar('reason', { length: 255 }), // 'user_requested', 'admin_override', 'payment_failed', etc.
  metadata: text('metadata'), // JSON string for additional data (old limits, new limits, etc.)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  processedAt: timestamp('processed_at'), // When the change was actually applied
}); 