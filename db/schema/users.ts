import { pgTable, serial, timestamp, varchar, text, boolean } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const users = pgTable('user', {
  id: serial('id').primaryKey(),
  createdTime: timestamp('created_time').defaultNow(),
  email: varchar('email').unique().notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  gender: text('gender'),
  profileImageUrl: text('profile_image_url'),
  userId: varchar('user_id').unique().notNull().$defaultFn(() => createId()),
  subscription: text('subscription'),
  // Profile fields
  company: varchar('company', { length: 100 }),
  jobTitle: varchar('job_title', { length: 100 }),
  bio: text('bio'),
  // Onboarding tracking
  onboardingCompleted: boolean('onboarding_completed').default(false),
  // Trial and subscription management fields
  isTrial: boolean('is_trial').default(true),
  trialExpiresAt: timestamp('trial_expires_at'),
  subscriptionStatus: varchar('subscription_status').default('trial'), // 'trial', 'active', 'past_due', 'canceled', etc.
  subscriptionTier: varchar('subscription_tier'), // 'basic', 'pro', 'business'
  subscriptionExpiresAt: timestamp('subscription_expires_at'), // When cancelled subscription actually expires
  // Subscription change tracking
  pendingSubscriptionChange: text('pending_subscription_change'), // JSON object with change details
  lastPlanChangeDate: timestamp('last_plan_change_date'), // Track when user last changed plans
  // Email tracking
  welcomeEmailSent: boolean('welcome_email_sent').default(false),
  paidWelcomeEmailSent: boolean('paid_welcome_email_sent').default(false),
  cancellationEmailSent: boolean('cancellation_email_sent').default(false),
  expiredEmailSent: boolean('expired_email_sent').default(false)
}); 