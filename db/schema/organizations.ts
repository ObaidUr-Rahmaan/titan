import { pgTable, serial, timestamp, varchar, text, boolean, integer, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  createdTime: timestamp('created_time').defaultNow(),
  updatedTime: timestamp('updated_time').defaultNow(),
  
  // Clerk organization data
  clerkOrganizationId: varchar('clerk_organization_id').unique().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  
  // Organization details
  description: text('description'),
  logoUrl: text('logo_url'),
  websiteUrl: text('website_url'),
  
  // Billing and subscription fields
  stripeCustomerId: varchar('stripe_customer_id').unique(),
  subscriptionStatus: varchar('subscription_status').default('trial'), // 'trial', 'active', 'past_due', 'canceled'
  subscriptionTier: varchar('subscription_tier'), // 'basic', 'pro', 'business'
  subscriptionExpiresAt: timestamp('subscription_expires_at'),
  isTrial: boolean('is_trial').default(true),
  trialExpiresAt: timestamp('trial_expires_at'),
  
  // Organization limits and settings
  memberLimit: integer('member_limit').default(5),
  currentMemberCount: integer('current_member_count').default(1),
  
  // Features enabled for this organization
  featuresEnabled: text('features_enabled'), // JSON array of enabled features
  
  // Domain verification (for enterprise features)
  verifiedDomains: text('verified_domains'), // JSON array of verified domains
  domainVerificationEnabled: boolean('domain_verification_enabled').default(false),
  
  // Organization settings
  allowMemberInvites: boolean('allow_member_invites').default(true),
  requireTwoFactor: boolean('require_two_factor').default(false),
  
  // Metadata
  metadata: text('metadata'), // JSON for additional custom data
  
  // Soft delete
  deletedAt: timestamp('deleted_at'),
  isActive: boolean('is_active').default(true)
});

// Define relationships
export const organizationsRelations = relations(organizations, ({ many, one }) => ({
  // One organization can have many members
  memberships: many(organizationMemberships),
  // One organization can have many invitations
  invitations: many(organizationInvitations),
  // One organization can have many subscriptions (for subscription changes/history)
  subscriptions: many(subscriptions),
  // One organization has one active subscription
  activeSubscription: one(subscriptions, {
    fields: [organizations.id],
    references: [subscriptions.organizationId],
  })
}));

// Import these after the table definition to avoid circular dependencies
import { organizationMemberships } from './organization-memberships';
import { organizationInvitations } from './organization-invitations';
import { subscriptions } from './subscriptions'; 