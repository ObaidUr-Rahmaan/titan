import * as dotenv from 'dotenv'
dotenv.config()

import { createDirectClient } from '../lib/drizzle'
import { sql } from 'drizzle-orm'

async function createRLSPolicies() {
  console.log('🔒 Creating comprehensive RLS policies for all tables...\n')
  
  const db = createDirectClient()
  
  try {
    // Enable RLS on all main tables first
    console.log('📋 Enabling RLS on all application tables...')
    
    const tables = [
      'user',
      'payments', 
      'subscriptions',
      'subscriptions_plans',
      'invoices',
      'refunds'
    ]
    
    for (const table of tables) {
      await db.execute(sql.raw(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`))
      console.log(`✅ RLS enabled on ${table}`)
    }
    
    console.log('\n🔐 Creating RLS policies...\n')
    
    // User table policies
    console.log('Creating policies for user table...')
    await db.execute(sql`
      CREATE POLICY "Users can view own profile" ON "user"
      FOR SELECT USING (
        (auth.uid())::text = user_id::text
      );
    `)
    
    await db.execute(sql`
      CREATE POLICY "Users can update own profile" ON "user"
      FOR UPDATE USING (
        (auth.uid())::text = user_id::text
      );
    `)
    
    await db.execute(sql`
      CREATE POLICY "Service role can manage all users" ON "user"
      FOR ALL USING (
        auth.role() = 'service_role'
      );
    `)
    console.log('✅ User policies created')
    
    // Payments table policies
    console.log('Creating policies for payments table...')
    await db.execute(sql`
      CREATE POLICY "Users can view own payments" ON payments
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM "user" 
          WHERE "user".id = payments.user_id 
          AND "user".user_id = (auth.uid())::text
        )
      );
    `)
    
    await db.execute(sql`
      CREATE POLICY "Service role can manage all payments" ON payments
      FOR ALL USING (
        auth.role() = 'service_role'
      );
    `)
    console.log('✅ Payments policies created')
    
    // Subscriptions table policies
    console.log('Creating policies for subscriptions table...')
    await db.execute(sql`
      CREATE POLICY "Users can view own subscriptions" ON subscriptions
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM "user" 
          WHERE "user".id = subscriptions.user_id 
          AND "user".user_id = (auth.uid())::text
        )
      );
    `)
    
    await db.execute(sql`
      CREATE POLICY "Service role can manage all subscriptions" ON subscriptions
      FOR ALL USING (
        auth.role() = 'service_role'
      );
    `)
    console.log('✅ Subscriptions policies created')
    
    // Subscription plans policies (read-only for authenticated users)
    console.log('Creating policies for subscriptions_plans table...')
    await db.execute(sql`
      CREATE POLICY "Authenticated users can view subscription plans" ON subscriptions_plans
      FOR SELECT USING (
        auth.role() = 'authenticated'
      );
    `)
    
    await db.execute(sql`
      CREATE POLICY "Service role can manage subscription plans" ON subscriptions_plans
      FOR ALL USING (
        auth.role() = 'service_role'
      );
    `)
    console.log('✅ Subscription plans policies created')
    
    // Invoices table policies
    console.log('Creating policies for invoices table...')
    await db.execute(sql`
      CREATE POLICY "Users can view own invoices" ON invoices
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM "user" 
          WHERE "user".id = invoices.user_id 
          AND "user".user_id = (auth.uid())::text
        )
      );
    `)
    
    await db.execute(sql`
      CREATE POLICY "Service role can manage all invoices" ON invoices
      FOR ALL USING (
        auth.role() = 'service_role'
      );
    `)
    console.log('✅ Invoices policies created')
    
    // Refunds table policies
    console.log('Creating policies for refunds table...')
    await db.execute(sql`
      CREATE POLICY "Users can view own refunds" ON refunds
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM "user" 
          WHERE "user".id = refunds.user_id 
          AND "user".user_id = (auth.uid())::text
        )
      );
    `)
    
    await db.execute(sql`
      CREATE POLICY "Service role can manage all refunds" ON refunds
      FOR ALL USING (
        auth.role() = 'service_role'
      );
    `)
    console.log('✅ Refunds policies created')
    
    console.log('\n✨ All RLS policies created successfully!')
    console.log('\n📊 Summary:')
    console.log(`✅ Tables with RLS enabled: ${tables.length}`)
    console.log('✅ Comprehensive security policies applied')
    console.log('✅ User data isolation enforced')
    console.log('✅ Service role access configured')
    
  } catch (error) {
    console.error('❌ Error creating RLS policies:', error)
    process.exit(1)
  }
}

// Run the script
createRLSPolicies().catch(console.error) 