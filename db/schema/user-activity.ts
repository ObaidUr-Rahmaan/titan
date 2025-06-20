import { pgTable, text, timestamp, jsonb, uuid, index } from 'drizzle-orm/pg-core'

export const userActivity = pgTable(
  'user_activity',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(),
    activityType: text('activity_type').notNull(),
    category: text('category').notNull().default('general'),
    title: text('title').notNull(),
    description: text('description'),
    metadata: jsonb('metadata').default({}),
    source: text('source').notNull().default('web'), // 'web' | 'api' | 'webhook' | 'admin' | 'cron'
    relatedEntityType: text('related_entity_type'),
    relatedEntityId: text('related_entity_id'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    
    // Organization context - nullable for backward compatibility
    organizationId: text('organization_id') // Clerk organization ID for context filtering
  },
  (table) => ({
    userIdIdx: index('user_activity_user_id_idx').on(table.userId),
    activityTypeIdx: index('user_activity_activity_type_idx').on(table.activityType),
    categoryIdx: index('user_activity_category_idx').on(table.category),
    createdAtIdx: index('user_activity_created_at_idx').on(table.createdAt),
    sourceIdx: index('user_activity_source_idx').on(table.source),
    relatedEntityIdx: index('user_activity_related_entity_idx').on(table.relatedEntityType, table.relatedEntityId),
    organizationIdIdx: index('user_activity_organization_id_idx').on(table.organizationId)
  })
)

export type UserActivity = typeof userActivity.$inferSelect
export type InsertUserActivity = typeof userActivity.$inferInsert 