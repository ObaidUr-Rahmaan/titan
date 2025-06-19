import * as dotenv from 'dotenv'
dotenv.config()

import { createDirectClient } from '../lib/drizzle'
import { sql } from 'drizzle-orm'

async function resetDatabase() {
  console.log('🔄 Starting comprehensive database reset...\n')
  
  const db = createDirectClient()
  
  try {
    // Step 1: Drop all existing policies
    console.log('🗑️  Dropping existing RLS policies...')
    
    const policies = await db.execute(sql`
      SELECT tablename, policyname 
      FROM pg_policies 
      WHERE schemaname = 'public'
    `)
    
    for (const policy of policies) {
      const tablename = (policy as any).tablename
      const policyname = (policy as any).policyname
      await db.execute(sql.raw(`DROP POLICY IF EXISTS "${policyname}" ON "${tablename}"`))
      console.log(`   ✅ Dropped policy: ${policyname} on ${tablename}`)
    }
    
    // Step 2: Disable RLS on all tables
    console.log('\n🔓 Disabling RLS on all tables...')
    
    const tables = await db.execute(sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `)
    
    for (const table of tables) {
      const tablename = (table as any).tablename
      await db.execute(sql.raw(`ALTER TABLE "${tablename}" DISABLE ROW LEVEL SECURITY`))
      console.log(`   ✅ RLS disabled on ${tablename}`)
    }
    
    // Step 3: Drop all application tables
    console.log('\n🗑️  Dropping all application tables...')
    
    const applicationTables = [
      'refunds',
      'invoices', 
      'subscriptions',
      'payments',
      'user',
      'subscriptions_plans'
    ]
    
    for (const table of applicationTables) {
      await db.execute(sql.raw(`DROP TABLE IF EXISTS "${table}" CASCADE`))
      console.log(`   ✅ Dropped table: ${table}`)
    }
    
    // Step 4: Drop custom types if they exist
    console.log('\n🗑️  Dropping custom types...')
    
    const customTypes = [
      'subscription_status',
      'payment_status',
      'refund_status'
    ]
    
    for (const type of customTypes) {
      await db.execute(sql.raw(`DROP TYPE IF EXISTS ${type} CASCADE`))
      console.log(`   ✅ Dropped type: ${type}`)
    }
    
    // Step 5: Clean up any remaining sequences
    console.log('\n🗑️  Cleaning up sequences...')
    
    const sequences = await db.execute(sql`
      SELECT sequencename 
      FROM pg_sequences 
      WHERE schemaname = 'public'
    `)
    
    for (const sequence of sequences) {
      const sequencename = (sequence as any).sequencename
      await db.execute(sql.raw(`DROP SEQUENCE IF EXISTS "${sequencename}" CASCADE`))
      console.log(`   ✅ Dropped sequence: ${sequencename}`)
    }
    
    // Step 6: Clean up any remaining functions
    console.log('\n🗑️  Cleaning up custom functions...')
    
    const functions = await db.execute(sql`
      SELECT proname, pg_get_function_identity_arguments(oid) as args
      FROM pg_proc 
      WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      AND proname NOT LIKE 'pg_%'
      AND proname NOT LIKE 'uuid_%'
    `)
    
    for (const func of functions) {
      const funcname = (func as any).proname
      const args = (func as any).args
      await db.execute(sql.raw(`DROP FUNCTION IF EXISTS "${funcname}"(${args}) CASCADE`))
      console.log(`   ✅ Dropped function: ${funcname}`)
    }
    
    console.log('\n✨ Database reset completed successfully!')
    console.log('\n📊 Summary:')
    console.log('✅ All RLS policies dropped')
    console.log('✅ All application tables dropped')
    console.log('✅ Custom types cleaned up')
    console.log('✅ Sequences cleaned up')
    console.log('✅ Custom functions cleaned up')
    console.log('\n🔄 Ready for fresh migration!')
    
  } catch (error) {
    console.error('❌ Error during database reset:', error)
    process.exit(1)
  }
}

// Run the reset
resetDatabase().catch(console.error) 