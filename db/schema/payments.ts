import { pgTable, serial, timestamp, text, varchar, integer } from 'drizzle-orm/pg-core';

export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  createdTime: timestamp('created_time').defaultNow(),
  stripeId: varchar('stripe_id').notNull(),
  email: varchar('email').notNull(),
  amount: varchar('amount').notNull(),
  paymentTime: varchar('payment_time').notNull(),
  paymentDate: varchar('payment_date').notNull(),
  currency: varchar('currency').notNull(),
  userId: varchar('user_id').notNull(),
  customerDetails: text('customer_details').notNull(),
  paymentIntent: varchar('payment_intent').notNull(),
  
  // Organization support - nullable for backward compatibility
  organizationId: integer('organization_id') // References organizations.id
});