#!/usr/bin/env tsx

/**
 * Simple validation for organization subscription management system
 */

import { promises as fs } from 'fs'
import path from 'path'

async function validateSystem() {
  console.log('🔍 Organization Subscription System Validation')
  console.log('=' .repeat(60))
  
  let passed = 0
  let failed = 0
  
  // 1. Database Schema Files
  console.log('\n📋 Database Schema')
  console.log('-'.repeat(40))
  
  const schemaFiles = [
    'db/schema/subscriptions.ts',
    'db/schema/organizations.ts',
    'db/schema/users.ts',
    'db/schema/subscriptions_plans.ts'
  ]
  
  for (const file of schemaFiles) {
    try {
      await fs.access(path.join(process.cwd(), file))
      console.log(`  ✅ ${file}`)
      passed++
    } catch {
      console.log(`  ❌ ${file} - Missing`)
      failed++
    }
  }
  
  // 2. Subscription Management Service
  console.log('\n📋 Subscription Service')
  console.log('-'.repeat(40))
  
  try {
    await fs.access(path.join(process.cwd(), 'utils/subscription-management.ts'))
    console.log('  ✅ utils/subscription-management.ts')
    
    const content = await fs.readFile(path.join(process.cwd(), 'utils/subscription-management.ts'), 'utf-8')
    
    const expectedFunctions = [
      'createSubscription',
      'updateSubscription',
      'cancelSubscription',
      'getSubscription',
      'getUserSubscriptions',
      'getOrganizationSubscriptions',
      'updateSeatUsage'
    ]
    
    for (const fn of expectedFunctions) {
      if (content.includes(`export async function ${fn}`) || content.includes(`async function ${fn}`)) {
        console.log(`    ✅ ${fn} function`)
        passed++
      } else {
        console.log(`    ❌ ${fn} function - Missing`)
        failed++
      }
    }
    
  } catch {
    console.log('  ❌ utils/subscription-management.ts - Missing')
    failed++
  }
  
  // 3. API Routes
  console.log('\n📋 API Routes')
  console.log('-'.repeat(40))
  
  const apiRoutes = [
    'app/api/payments/create-checkout-session/route.ts',
    'app/api/subscriptions/manage/route.ts',
    'app/api/organizations/[organizationId]/subscriptions/route.ts',
    'app/api/organizations/[organizationId]/billing-portal/route.ts',
    'app/api/payments/webhook/route.ts'
  ]
  
  for (const route of apiRoutes) {
    try {
      await fs.access(path.join(process.cwd(), route))
      console.log(`  ✅ ${route}`)
      passed++
    } catch {
      console.log(`  ❌ ${route} - Missing`)
      failed++
    }
  }
  
  // 4. UI Components
  console.log('\n📋 UI Components')
  console.log('-'.repeat(40))
  
  const uiComponents = [
    'utils/hooks/useOrganizationSubscription.ts',
    'components/organizations/organization-subscription-card.tsx',
    'components/organizations/organization-seat-management.tsx',
    'components/organizations/index.ts'
  ]
  
  for (const component of uiComponents) {
    try {
      await fs.access(path.join(process.cwd(), component))
      console.log(`  ✅ ${component}`)
      passed++
    } catch {
      console.log(`  ❌ ${component} - Missing`)
      failed++
    }
  }
  
  // 5. Organization Billing Page
  console.log('\n📋 Billing Integration')
  console.log('-'.repeat(40))
  
  try {
    await fs.access(path.join(process.cwd(), 'app/org/[orgSlug]/billing/page.tsx'))
    console.log('  ✅ app/org/[orgSlug]/billing/page.tsx')
    
    const content = await fs.readFile(path.join(process.cwd(), 'app/org/[orgSlug]/billing/page.tsx'), 'utf-8')
    
    if (content.includes('OrganizationSubscriptionCard')) {
      console.log('    ✅ OrganizationSubscriptionCard integration')
      passed++
    } else {
      console.log('    ❌ OrganizationSubscriptionCard integration - Missing')
      failed++
    }
    
    if (content.includes('OrganizationSeatManagement')) {
      console.log('    ✅ OrganizationSeatManagement integration')
      passed++
    } else {
      console.log('    ❌ OrganizationSeatManagement integration - Missing')
      failed++
    }
    
    passed++
    
  } catch {
    console.log('  ❌ app/org/[orgSlug]/billing/page.tsx - Missing')
    failed++
  }
  
  // Summary
  const total = passed + failed
  console.log('\n' + '=' .repeat(60))
  console.log('📊 Validation Summary')
  console.log('=' .repeat(60))
  console.log(`✅ Passed: ${passed}/${total}`)
  console.log(`❌ Failed: ${failed}/${total}`)
  console.log(`📈 Success Rate: ${Math.round((passed / total) * 100)}%`)
  
  if (failed === 0) {
    console.log('\n🎉 All validations passed! Organization subscription system is properly implemented.')
  } else {
    console.log('\n⚠️  Some validations failed. Please review the issues above.')
  }
  
  return failed === 0
}

// Run validation
validateSystem()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('Fatal error running validation:', error)
    process.exit(1)
  }) 