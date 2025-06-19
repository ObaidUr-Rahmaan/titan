---
description:
globs:
alwaysApply: false
---
# Migration Patterns for Titan Upgrades

Guidelines for safely migrating improvements from evolved projects back to Titan.

## **Migration Safety Principles**

### **1. Backward Compatibility**
- **✅ DO**: Add new features as opt-in
- **✅ DO**: Maintain existing API interfaces
- **✅ DO**: Use feature flags for breaking changes
- **❌ DON'T**: Remove existing functionality without deprecation
- **❌ DON'T**: Change core file structures without migration guides

### **2. Progressive Enhancement**
- **✅ DO**: Add improvements as enhancements to existing patterns
- **✅ DO**: Provide both old and new ways initially
- **✅ DO**: Document migration paths clearly
- **❌ DON'T**: Force immediate adoption of new patterns

### **3. Testing & Validation**
- **✅ DO**: Test CLI generation after each change
- **✅ DO**: Validate that generated projects work correctly
- **✅ DO**: Run existing examples to ensure compatibility
- **❌ DON'T**: Merge without comprehensive testing

## **Migration Patterns by Domain**

### **Configuration Changes**
```typescript
// ✅ DO: Extend existing configs
// package.json - Add new scripts, don't remove old ones
{
  "scripts": {
    "dev": "next dev", // Keep existing
    "build": "next build", // Keep existing
    "dev:debug": "next dev --inspect", // Add new
    "build:analyze": "ANALYZE=true next build" // Add new
  }
}

// ✅ DO: Add optional environment variables
// .env.example - Add new vars with defaults
EXISTING_VAR=value
NEW_OPTIONAL_VAR=default_value # Add with default

// ❌ DON'T: Remove or rename existing environment variables
```

### **Component Improvements**
```typescript
// ✅ DO: Enhance existing components without breaking changes
// components/ui/button.tsx
interface ButtonProps {
  variant?: 'default' | 'secondary' // Keep existing
  size?: 'sm' | 'md' | 'lg' // Keep existing
  loading?: boolean // Add new optional prop
  icon?: React.ReactNode // Add new optional prop
}

// ✅ DO: Add new components in appropriate directories
// components/ui/data-table.tsx - New component
// components/ui/command-palette.tsx - New component

// ❌ DON'T: Change existing component prop interfaces
```

### **Database Schema Changes**
```typescript
// ✅ DO: Add new tables and columns
// db/schema/analytics.ts - New table
export const analytics = pgTable('analytics', {
  id: serial('id').primaryKey(),
  // ... new table structure
})

// db/schema/users.ts - Add optional columns
export const users = pgTable('users', {
  // ... existing columns
  preferences: jsonb('preferences'), // Add optional
  lastLoginAt: timestamp('last_login_at') // Add optional
})

// ✅ DO: Create migration files for schema changes
// drizzle/migrations/add_analytics_table.sql

// ❌ DON'T: Modify existing required columns
// ❌ DON'T: Remove existing tables or columns
```

### **API Route Enhancements**
```typescript
// ✅ DO: Add new endpoints
// app/api/analytics/route.ts - New endpoint
// app/api/health/route.ts - New endpoint

// ✅ DO: Enhance existing endpoints with backward compatibility
// app/api/payments/webhook/route.ts
export async function POST(request: Request) {
  // ... existing webhook handling
  
  // Add new event handling without breaking existing
  if (event.type === 'customer.subscription.paused') {
    // New event handling
  }
}

// ❌ DON'T: Change existing endpoint response formats
// ❌ DON'T: Remove existing endpoints
```

### **Utility Function Improvements**
```typescript
// ✅ DO: Add new utility functions
// utils/analytics.ts - New utility file
// utils/validation.ts - Enhanced validation

// ✅ DO: Enhance existing functions with optional parameters
// utils/auth.ts
export function getUser(options?: {
  includePreferences?: boolean // Add optional param
  includeAnalytics?: boolean // Add optional param
}) {
  // ... existing logic
  // ... new optional features
}

// ❌ DON'T: Change existing function signatures
// ❌ DON'T: Remove existing utility functions
```

## **Migration Implementation Strategy**

### **Phase 1: Safe Additions**
1. **Add new files and directories**
   - New components, utilities, API routes
   - Additional configuration files
   - New database tables/optional columns

2. **Extend existing configurations**
   - Add new scripts to package.json
   - Add new environment variables with defaults
   - Extend TypeScript and ESLint configs

### **Phase 2: Enhanced Patterns**
1. **Improve existing patterns without breaking changes**
   - Add optional props to components
   - Enhance utility functions with optional parameters
   - Add new middleware without replacing existing

2. **Add progressive enhancements**
   - Better error handling (non-breaking)
   - Performance optimizations (transparent)
   - Security improvements (additive)

### **Phase 3: Documentation & Examples**
1. **Update documentation**
   - Add new feature documentation
   - Update examples to show new patterns
   - Create migration guides for optional upgrades

2. **Update CLI templates**
   - Ensure new projects get latest patterns
   - Maintain backward compatibility for existing projects

## **Testing Requirements**

### **Before Migration**
```bash
# Test current CLI functionality
cd packages/create-titan
npm run build
npm run test

# Test example generation
npx create-titan test-app
cd test-app
npm install
npm run build
npm run dev # Verify it works
```

### **After Each Migration**
```bash
# Test CLI still works
npm run build
npx create-titan test-upgraded-app
cd test-upgraded-app
npm install
npm run build
npm run dev

# Verify new features work
npm run test # If tests exist
npm run lint
```

### **Integration Testing**
- **Generate multiple test projects** with different configurations
- **Test that existing projects can adopt new features** incrementally
- **Verify CLI options and flags** still work correctly
- **Check that documentation** matches actual behavior

## **Risk Assessment Matrix**

### **Low Risk (Green Light)**
- Adding new optional environment variables
- Adding new components or utilities
- Adding new API endpoints
- Adding new database tables
- Adding new npm scripts

### **Medium Risk (Caution Required)**
- Modifying existing components with new optional props
- Enhancing existing API endpoints
- Adding optional database columns
- Updating configuration files with new options
- Changing development workflow scripts

### **High Risk (Careful Review)**
- Modifying middleware.ts or core authentication
- Changing existing database schema (required columns)
- Updating core dependencies (major versions)
- Modifying existing API response formats
- Changing build or deployment processes

## **Rollback Strategy**
- **Keep git commits atomic** - one improvement per commit
- **Tag stable versions** before major migrations
- **Document all changes** in TaskMaster for easy review
- **Maintain changelog** of all modifications
- **Test rollback procedures** on each major change
