import { pgTable, serial, timestamp, varchar, text, boolean, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organizations';
import { users } from './users';

export const organizationMemberships = pgTable('organization_memberships', {
  id: serial('id').primaryKey(),
  createdTime: timestamp('created_time').defaultNow(),
  updatedTime: timestamp('updated_time').defaultNow(),
  
  // Foreign key relationships
  organizationId: integer('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Clerk organization membership data
  clerkOrganizationId: varchar('clerk_organization_id').notNull(),
  clerkUserId: varchar('clerk_user_id').notNull(),
  
  // Member role and permissions
  role: varchar('role').notNull().default('member'), // 'owner', 'admin', 'billing_manager', 'project_manager', 'developer', 'member', 'viewer'
  permissions: text('permissions'), // JSON array of specific permissions
  
  // Membership status
  status: varchar('status').default('active'), // 'active', 'invited', 'suspended', 'removed'
  joinedAt: timestamp('joined_at').defaultNow(),
  invitedAt: timestamp('invited_at'),
  invitedBy: integer('invited_by').references(() => users.id),
  
  // Role change tracking
  previousRole: varchar('previous_role'),
  roleChangedAt: timestamp('role_changed_at'),
  roleChangedBy: integer('role_changed_by').references(() => users.id),
  
  // Access control
  lastActiveAt: timestamp('last_active_at'),
  accessLevel: varchar('access_level').default('full'), // 'full', 'read_only', 'restricted'
  
  // Soft delete
  removedAt: timestamp('removed_at'),
  removedBy: integer('removed_by').references(() => users.id),
  isActive: boolean('is_active').default(true)
});

// Define relationships
export const organizationMembershipsRelations = relations(organizationMemberships, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationMemberships.organizationId],
    references: [organizations.id]
  }),
  user: one(users, {
    fields: [organizationMemberships.userId],
    references: [users.id]
  }),
  inviter: one(users, {
    fields: [organizationMemberships.invitedBy],
    references: [users.id]
  }),
  roleChanger: one(users, {
    fields: [organizationMemberships.roleChangedBy],
    references: [users.id]
  }),
  remover: one(users, {
    fields: [organizationMemberships.removedBy],
    references: [users.id]
  })
})); 