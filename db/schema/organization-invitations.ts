import { pgTable, serial, timestamp, varchar, text, boolean, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organizations';
import { users } from './users';

export const organizationInvitations = pgTable('organization_invitations', {
  id: serial('id').primaryKey(),
  createdTime: timestamp('created_time').defaultNow(),
  updatedTime: timestamp('updated_time').defaultNow(),
  
  // Organization relationship
  organizationId: integer('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  clerkOrganizationId: varchar('clerk_organization_id').notNull(),
  
  // Invitation details
  email: varchar('email').notNull(),
  role: varchar('role').notNull().default('member'), // Role to assign when accepted
  permissions: text('permissions'), // JSON array of specific permissions
  
  // Invitation metadata
  invitationToken: varchar('invitation_token').unique().notNull(), // Unique token for the invitation
  clerkInvitationId: varchar('clerk_invitation_id'), // Clerk's invitation ID
  
  // Inviter information
  invitedBy: integer('invited_by').notNull().references(() => users.id),
  inviterName: varchar('inviter_name'),
  inviterEmail: varchar('inviter_email'),
  
  // Personal message
  message: text('message'), // Optional personal message from inviter
  
  // Invitation status and timing
  status: varchar('status').default('pending'), // 'pending', 'accepted', 'declined', 'expired', 'revoked'
  sentAt: timestamp('sent_at').defaultNow(),
  expiresAt: timestamp('expires_at'), // When invitation expires
  respondedAt: timestamp('responded_at'), // When invitation was accepted/declined
  
  // Response details
  acceptedBy: integer('accepted_by').references(() => users.id), // User who accepted the invitation
  declinedReason: text('declined_reason'), // Optional reason for declining
  
  // Email tracking
  emailSent: boolean('email_sent').default(false),
  remindersSent: integer('reminders_sent').default(0),
  lastReminderSent: timestamp('last_reminder_sent'),
  
  // Revocation
  revokedAt: timestamp('revoked_at'),
  revokedBy: integer('revoked_by').references(() => users.id),
  revokedReason: text('revoked_reason'),
  
  // Invitation limits and validation
  maxUses: integer('max_uses').default(1), // How many times this invitation can be used
  usedCount: integer('used_count').default(0), // How many times it has been used
  
  // Metadata
  metadata: text('metadata'), // JSON for additional data
  
  // Soft delete
  isActive: boolean('is_active').default(true)
});

// Define relationships
export const organizationInvitationsRelations = relations(organizationInvitations, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationInvitations.organizationId],
    references: [organizations.id]
  }),
  inviter: one(users, {
    fields: [organizationInvitations.invitedBy],
    references: [users.id]
  }),
  accepter: one(users, {
    fields: [organizationInvitations.acceptedBy],
    references: [users.id]
  }),
  revoker: one(users, {
    fields: [organizationInvitations.revokedBy],
    references: [users.id]
  })
})); 