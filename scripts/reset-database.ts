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
    
    // Step 3: Drop all tables in public schema (except system tables)
    console.log('\n🗑️  Dropping all tables in public schema...')
    
    const allTables = await db.execute(sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE 'sql_%'
      AND tablename NOT LIKE 'information_%'
    `)
    
    for (const table of allTables) {
      const tablename = (table as any).tablename
      await db.execute(sql.raw(`DROP TABLE IF EXISTS "${tablename}" CASCADE`))
      console.log(`   ✅ Dropped table: ${tablename}`)
    }
    
    // Step 4: Drop all custom types in public schema
    console.log('\n🗑️  Dropping all custom types...')
    
    const allTypes = await db.execute(sql`
      SELECT typname 
      FROM pg_type 
      WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      AND typtype = 'e'
    `)
    
    for (const type of allTypes) {
      const typename = (type as any).typname
      await db.execute(sql.raw(`DROP TYPE IF EXISTS "${typename}" CASCADE`))
      console.log(`   ✅ Dropped type: ${typename}`)
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