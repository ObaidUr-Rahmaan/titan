import { pgTable, serial, timestamp, text, varchar, integer } from 'drizzle-orm/pg-core';

export const refunds = pgTable('refunds', {
  id: serial('id').primaryKey(),
  createdTime: timestamp('created_time').defaultNow(),
  paymentId: varchar('payment_id').notNull(),
  userId: varchar('user_id').notNull(),
  refundId: varchar('refund_id').notNull(),
  amount: varchar('amount').notNull(),
  currency: varchar('currency').notNull(),
  refundDate: timestamp('refund_date').notNull(),
  status: varchar('status').notNull(),
  reason: text('reason'),
  metadata: text('metadata'),
  
  // Organization support - nullable for backward compatibility
  organizationId: integer('organization_id') // References organizations.id
}); 