import { pgTable, serial, timestamp, varchar, integer } from 'drizzle-orm/pg-core';

export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  createdTime: timestamp('created_time').defaultNow(),
  invoiceId: varchar('invoice_id').notNull(),
  subscriptionId: varchar('subscription_id').notNull(),
  amountPaid: varchar('amount_paid').notNull(),
  amountDue: varchar('amount_due'),
  currency: varchar('currency').notNull(),
  status: varchar('status').notNull(),
  email: varchar('email').notNull(),
  userId: varchar('user_id'),
  
  // Organization support - nullable for backward compatibility
  organizationId: integer('organization_id') // References organizations.id
}); 