import * as dotenv from 'dotenv'
dotenv.config()

import { createDirectClient } from '../lib/drizzle'
import { sql } from 'drizzle-orm'

interface TableRLSStatus {
  tablename: string
  rls_enabled: boolean
  policy_count: number
}

interface PolicyInfo {
  tablename: string
  policyname: string
  permissive: string
  roles: string[]
  cmd: string
  qual: string
  with_check: string
}

async function auditRLSStatus() {
  console.log('🔍 Starting RLS audit for all application tables...\n')
  
  const db = createDirectClient()
  
  // List of all our application tables
  const expectedTables = [
    'user',
    'payments',
    'subscriptions', 
    'subscriptions_plans',
    'invoices',
    'refunds'
  ]

  try {
    // Check RLS status for our application tables
    console.log('📋 APPLICATION TABLES RLS STATUS:')
    console.log('='.repeat(50))
    
    const rlsStatusResults = await db.execute(sql`
      SELECT 
          t.tablename,
          t.rowsecurity as rls_enabled,
          COUNT(p.policyname) as policy_count
      FROM pg_tables t
      LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
      WHERE t.schemaname = 'public' 
          AND t.tablename = ANY(${expectedTables})
      GROUP BY t.tablename, t.rowsecurity
      ORDER BY t.tablename
    `)
    
    // Process results without strict typing for now
    const tableStatuses: any[] = []
    for (const row of rlsStatusResults) {
      tableStatuses.push({
        tablename: (row as any).tablename,
        rls_enabled: (row as any).rls_enabled,
        policy_count: Number.parseInt((row as any).policy_count || '0')
      })
    }
    
    for (const table of tableStatuses) {
      const status = table.rls_enabled ? '✅ ENABLED' : '❌ DISABLED'
      const policies = table.policy_count > 0 ? `(${table.policy_count} policies)` : '(no policies)'
      console.log(`${table.tablename.padEnd(25)} ${status} ${policies}`)
    }

    // Count tables missing RLS
    const tablesWithoutRLS = tableStatuses.filter((t: any) => !t.rls_enabled)
    const tablesWithRLS = tableStatuses.filter((t: any) => t.rls_enabled)
    
    console.log('\n📊 SUMMARY:')
    console.log('='.repeat(30))
    console.log(`✅ Tables with RLS enabled: ${tablesWithRLS.length}`)
    console.log(`❌ Tables without RLS: ${tablesWithoutRLS.length}`)
    console.log(`📝 Total application tables: ${tableStatuses.length}`)
    
    if (tablesWithoutRLS.length > 0) {
      console.log('\n⚠️  TABLES REQUIRING RLS SETUP:')
      tablesWithoutRLS.forEach((table: any) => {
        console.log(`   • ${table.tablename}`)
      })
    }

    // Get detailed policy information for tables that have RLS enabled
    if (tablesWithRLS.length > 0) {
      console.log('\n🔐 EXISTING RLS POLICIES:')
      console.log('='.repeat(40))
      
      const policiesResult = await db.execute(sql`
        SELECT 
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
        FROM pg_policies 
        WHERE schemaname = 'public'
            AND tablename = ANY(${tablesWithRLS.map((t: any) => t.tablename)})
        ORDER BY tablename, policyname
      `)
      
      const policies: any[] = []
      for (const row of policiesResult) {
        policies.push({
          tablename: (row as any).tablename,
          policyname: (row as any).policyname,
          permissive: (row as any).permissive,
          roles: (row as any).roles,
          cmd: (row as any).cmd,
          qual: (row as any).qual,
          with_check: (row as any).with_check
        })
      }
      
      if (policies.length > 0) {
        let currentTable = ''
        for (const policy of policies) {
          if (policy.tablename !== currentTable) {
            if (currentTable !== '') console.log('')
            console.log(`📋 ${policy.tablename}:`)
            currentTable = policy.tablename
          }
          console.log(`   • ${policy.policyname} (${policy.cmd}) - ${policy.permissive}`)
          if (policy.roles) {
            console.log(`     Roles: ${policy.roles.join(', ')}`)
          }
          if (policy.qual) {
            console.log(`     Condition: ${policy.qual}`)
          }
        }
      } else {
        console.log('No policies found for tables with RLS enabled.')
      }
    }

    // Check for any other tables in public schema that might need attention
    console.log('\n🔍 ALL PUBLIC SCHEMA TABLES:')
    console.log('='.repeat(35))
    
    const allTablesResult = await db.execute(sql`
      SELECT 
          tablename,
          rowsecurity as rls_enabled
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `)
    
    const allTables: any[] = []
    for (const row of allTablesResult) {
      allTables.push({
        tablename: (row as any).tablename,
        rls_enabled: (row as any).rls_enabled
      })
    }
    
    for (const table of allTables) {
      const isAppTable = expectedTables.includes(table.tablename)
      const status = table.rls_enabled ? '✅' : '❌'
      const tableType = isAppTable ? '[APP]' : '[SYS]'
      console.log(`${table.tablename.padEnd(30)} ${status} ${tableType}`)
    }

    console.log('\n✨ RLS audit completed successfully!')
    
  } catch (error) {
    console.error('❌ Error during RLS audit:', error)
    process.exit(1)
  }
}

// Run the audit
auditRLSStatus().catch(console.error) 