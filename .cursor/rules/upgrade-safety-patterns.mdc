---
description: 
globs: 
alwaysApply: false
---
# Upgrade Safety Patterns

Best practices for safely implementing Titan upgrades in existing projects.

## **Pre-Upgrade Safety Checklist**

### **Repository State**
- **✅ Clean Working Directory**: All changes committed or stashed
- **✅ Recent Backup**: Push to remote or create local backup branch
- **✅ Working Build**: Verify project builds and runs correctly before upgrade
- **✅ Test Baseline**: Run existing tests to establish baseline

### **Environment Verification**
- **✅ Dependencies Installed**: All current dependencies working
- **✅ Environment Variables**: All required env vars present and valid
- **✅ Database Connection**: Database accessible and migrations up to date
- **✅ External Services**: APIs and integrations functioning

## **Safe Implementation Patterns**

### **1. Incremental Application**
```bash
# Apply upgrades one domain at a time
# Test after each domain before proceeding

# Domain 1: Components
git add components/
git commit -m "feat: upgrade components from Titan latest"
bun run build && bun run dev # Test

# Domain 2: Utils  
git add utils/
git commit -m "feat: upgrade utilities from Titan latest"
bun run build && bun run dev # Test

# Continue for each domain...
```

### **2. Feature Flag Pattern**
```typescript
// For significant changes, use feature flags
const ENABLE_NEW_FEATURE = process.env.ENABLE_NEW_FEATURE === 'true'

export function enhancedComponent() {
  if (ENABLE_NEW_FEATURE) {
    return <NewImprovedComponent />
  }
  return <OriginalComponent />
}
```

### **3. Gradual Migration Pattern**
```typescript
// Keep old and new versions side by side initially
export const useAuth = () => {
  // New improved version
  return useAuthV2()
}

export const useAuthLegacy = () => {
  // Original version for fallback
  return useAuthV1()
}
```

### **4. Configuration Merging**
```typescript
// Merge configurations safely, preserving existing values
const existingConfig = loadExistingConfig()
const titanUpdates = loadTitanConfig()

const mergedConfig = {
  ...existingConfig,
  // Only add new keys, don't override existing
  ...Object.fromEntries(
    Object.entries(titanUpdates).filter(
      ([key]) => !(key in existingConfig)
    )
  )
}
```

## **Testing Strategy**

### **Automated Testing**
```bash
# Run tests after each domain upgrade
bun run test              # Unit tests
bun run test:integration  # Integration tests  
bun run build            # Build verification
bun run lint             # Code quality
bun run type-check       # TypeScript validation
```

### **Manual Testing Checklist**
- **✅ Core User Flows**: Login, main features, checkout/payments
- **✅ Navigation**: All routes load correctly
- **✅ Database Operations**: CRUD operations work
- **✅ API Endpoints**: Test critical API routes
- **✅ Authentication**: Login/logout cycles
- **✅ Payments**: Test subscription flows (if applicable)
- **✅ Email**: Verify email sending works
- **✅ Mobile Responsive**: Check mobile layouts

### **Performance Verification**
```typescript
// Before and after performance comparison
const performanceMetrics = {
  buildTime: measureBuildTime(),
  bundleSize: measureBundleSize(),
  loadTime: measurePageLoadTime(),
  testRunTime: measureTestSuite()
}
```

## **Error Handling & Recovery**

### **Rollback Procedures**
```bash
# Quick rollback if issues found
git checkout main
git branch -D upgrade/titan-latest

# Partial rollback of specific changes
git checkout upgrade/titan-latest
git revert <commit-hash>  # Revert specific domain upgrade
```

### **Conflict Resolution**
```typescript
// When files conflict, preserve custom logic
const resolveConflict = (current: any, titanUpdate: any, custom: any) => {
  return {
    ...titanUpdate,    // New improvements
    ...custom,         // Preserve customizations
    ...current         // Keep current overrides
  }
}
```

### **Dependency Conflicts**
```json
// package.json conflict resolution
{
  "dependencies": {
    // Keep existing versions for critical deps
    "next": "15.0.0",  // Current version - don't auto-upgrade
    // Safe to upgrade utilities
    "@types/node": "^20.0.0"  // Latest from Titan
  },
  "packageManager": "bun@1.1.0"
}
```

## **Validation Patterns**

### **Build Validation**
```bash
# Comprehensive build validation
bun run clean       # Clear cache
bun install         # Fresh dependencies
bun run build       # Full build
bun run start       # Production test
```

### **Runtime Validation**
```typescript
// Validate critical functionality after upgrade
const validateUpgrade = async () => {
  // Test database connection
  await testDbConnection()
  
  // Test authentication
  await testAuthFlow()
  
  // Test external APIs
  await testExternalAPIs()
  
  // Test payment processing
  await testPaymentFlow()
}
```

### **Data Integrity Checks**
```typescript
// Ensure upgrade doesn't affect existing data
const validateDataIntegrity = async () => {
  // Check user data
  const userCount = await db.user.count()
  console.log(`User count: ${userCount}`)
  
  // Check critical business data
  const orderCount = await db.order.count()
  console.log(`Order count: ${orderCount}`)
  
  // Verify relationships intact
  await validateRelationships()
}
```

## **Documentation Requirements**

### **Upgrade Log**
```markdown
# Upgrade Log: Titan Latest -> [Project Name]

## Changes Applied
- ✅ Components: Added new UI components (Button, Dialog)
- ✅ Utils: Enhanced data validation helpers
- ⚠️ Config: Updated Tailwind config (tested)
- 🔶 Payments: Skipped - conflicts with custom billing
- 🚫 Auth: Skipped - custom implementation

## Testing Results
- Build: ✅ Success
- Tests: ✅ All passing  
- Manual: ✅ Core flows working
- Performance: ✅ No degradation

## Issues & Resolutions
- TypeScript errors in utils/validation.ts - Fixed
- Styling conflicts in Button component - Resolved

## Rollback Plan
- Branch: upgrade/titan-latest
- Commits: abc123, def456, ghi789
- Command: `git checkout main && git branch -D upgrade/titan-latest`
```

### **Team Communication**
```markdown
# Upgrade Summary for Team

## What Changed
Brief summary of applied improvements

## What to Know
New patterns, APIs, or tools now available

## Breaking Changes
None applied - all backward compatible

## Next Steps
Testing recommendations, deployment notes
```

## **Post-Upgrade Monitoring**

### **Performance Monitoring**
- Monitor build times for regressions
- Track bundle size changes
- Watch for memory leaks or performance issues
- Monitor API response times

### **Error Tracking**
- Watch error logs for new issues
- Monitor authentication failures
- Track payment processing errors
- Check email delivery rates

### **User Impact Assessment**
- Monitor user behavior for unusual patterns
- Check conversion rates for payment flows
- Verify core user journeys working
- Gather feedback on any UI changes

## **Upgrade Success Criteria**

### **Technical Success**
- ✅ All tests pass
- ✅ Build succeeds
- ✅ No TypeScript errors
- ✅ Performance maintained

### **Functional Success**
- ✅ Core features work
- ✅ Authentication flows
- ✅ Payment processing
- ✅ Data operations

### **Quality Success**
- ✅ Code quality improved
- ✅ Developer experience enhanced
- ✅ Maintainability increased
- ✅ Security posture maintained
