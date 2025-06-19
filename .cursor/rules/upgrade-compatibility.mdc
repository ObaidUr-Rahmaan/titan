---
description:
globs:
alwaysApply: false
---
# Upgrade Compatibility Assessment

Rules for determining which Titan improvements can be safely applied to existing projects.

## **Compatibility Classification**

### **✅ SAFE TO APPLY** (Green Light)
**Criteria**: Won't break existing functionality, purely additive
- **New optional utility functions** in `utils/` that don't conflict with existing names
- **Additional Shadcn components** that aren't already customized
- **New optional configuration** that doesn't override existing settings
- **Documentation improvements** and README updates
- **New development scripts** that don't replace existing functionality
- **Optional environment variables** with sensible defaults

**Examples**:
- New hook `useLocalStorage` added to `utils/hook/` (if not already exists)
- New component `components/ui/progress.tsx` (if project doesn't have custom progress)
- New optional env var `ENABLE_ANALYTICS=true` with default fallback

### **⚠️ REQUIRES TESTING** (Yellow Light)
**Criteria**: Likely safe but needs verification, may have subtle impacts
- **Package.json script modifications** that enhance existing scripts
- **Configuration file updates** that add new options
- **Middleware enhancements** that add features without changing core logic
- **Component improvements** that maintain same API but improve functionality
- **Database helper additions** that don't modify existing schema

**Examples**:
- Enhanced `build` script that adds optimization flags
- New Tailwind config options for better design system
- Improved error handling in existing API routes
- Performance optimizations in existing components

**Required Checks**:
- Verify builds succeed after changes
- Test critical user flows manually
- Check for TypeScript errors
- Validate environment still works

### **🔶 MANUAL REVIEW REQUIRED** (Orange Light)  
**Criteria**: Could break things, requires careful analysis and user decision
- **Dependency version upgrades** (especially major versions)
- **Authentication flow modifications** in middleware or auth routes
- **Database schema changes** or migration improvements
- **API route modifications** that change request/response format
- **Payment integration changes** that affect Stripe webhooks or billing
- **Core component modifications** that change props or behavior

**Examples**:
- Upgrading Clerk from v4 to v5 (breaking changes likely)
- Changing middleware authentication logic
- Modifying Stripe webhook signature validation
- Updating database schema with new required fields
- Upgrading Next.js version (requires research on breaking changes, migration complexity, and benefits)

**Required Process**:
- Present options to user with clear risk/benefit analysis
- Show exactly what would change and potential impact
- For Next.js upgrades: Research breaking changes, new features, migration complexity
- Provide rollback instructions
- Require explicit user approval before proceeding

### **🚫 DO NOT APPLY** (Red Light)
**Criteria**: High risk of breaking, project-specific, or not applicable
- **Custom business logic** that's specific to the original project
- **Project-specific database schemas** and custom tables
- **Custom API endpoints** built for specific use cases
- **Personalized branding, styling, or content**
- **Third-party integrations** specific to original project
- **Custom authentication providers** or unusual auth flows

**Examples**:
- Custom user dashboard with specific widgets
- Project-specific API endpoints like `/api/custom-analytics`
- Custom Stripe product catalogs and pricing tiers
- Branded email templates with specific company content
- Custom database tables for domain-specific features

## **Domain-Specific Compatibility Rules**

### **Authentication & Middleware**
- **✅ Safe**: Adding new optional auth features, improving error messages
- **⚠️ Test**: Enhancing existing auth flows, updating session handling
- **🔶 Review**: Changing core middleware logic, updating auth providers
- **🚫 Skip**: Custom auth implementations, project-specific user roles

### **Payments & Billing**
- **✅ Safe**: Adding new optional Stripe helpers, improving webhook logging
- **⚠️ Test**: Enhancing existing webhook handling, adding payment methods
- **🔶 Review**: Changing subscription logic, modifying billing cycles
- **🚫 Skip**: Custom pricing models, project-specific payment flows

### **Database & Schema**
- **✅ Safe**: Adding new optional utility functions, query helpers
- **⚠️ Test**: Performance optimizations, connection improvements
- **🔶 Review**: Schema modifications, new required fields
- **🚫 Skip**: Project-specific tables, custom relationships, domain data

### **Components & UI**
- **✅ Safe**: New optional components, accessibility improvements
- **⚠️ Test**: Enhancing existing component APIs, style updates
- **🔶 Review**: Breaking component prop changes, major style overhauls
- **🚫 Skip**: Custom branded components, project-specific UI patterns

### **Configuration & Environment**
- **✅ Safe**: New optional env vars with defaults, build optimizations
- **⚠️ Test**: Config enhancements, development script improvements
- **🔶 Review**: Required new env vars, build process changes, Next.js version upgrades
- **🚫 Skip**: Project-specific configs, custom deployment settings

## **Compatibility Checks**

### **Automated Checks**
```typescript
// Check for naming conflicts
const hasConflict = (newUtil: string, existingUtils: string[]) => {
  return existingUtils.includes(newUtil)
}

// Check for package version compatibility
const checkPackageCompat = (currentVer: string, newVer: string) => {
  // Major version changes require review
  // Minor/patch changes are usually safe
}
```

### **File Conflict Detection**
- **Exact Path Match**: Skip if file already exists with custom content
- **Similar Functionality**: Review if existing file serves same purpose
- **Namespace Collision**: Check for function/component name conflicts

### **API Compatibility**
- **Route Conflicts**: Don't add routes that already exist
- **Response Format**: Don't change existing API response structures
- **Webhook Signatures**: Don't modify existing webhook handling

### **Database Compatibility**
- **Schema Conflicts**: Don't modify existing table structures
- **Migration Safety**: Only add new optional fields/tables
- **Relationship Integrity**: Don't change existing foreign keys

### **Next.js Version Upgrade Assessment**
- **Release Notes Research**: Check official Next.js release notes for breaking changes
- **Migration Guide Review**: Analyze official migration documentation and codemods
- **Community Feedback**: Research community reports of upgrade experiences and issues
- **App Router Compatibility**: Verify new features don't conflict with current App Router usage
- **Dependencies Impact**: Check if upgrade affects other dependencies (React, TypeScript, etc.)
- **Performance Benefits**: Assess if new version offers meaningful performance improvements
- **Security Updates**: Prioritize upgrades that include important security fixes
- **Migration Complexity**: Estimate time/effort required for safe migration
- **Rollback Plan**: Ensure ability to revert if upgrade causes issues

## **Decision Framework**

### **Step 1: Classify the Change**
Use the traffic light system above to categorize each potential upgrade.

### **Step 2: Check Conflicts**
Run automated checks for naming, file, and API conflicts.

### **Step 3: Assess Impact**
- **User Impact**: Will users notice any difference?
- **Developer Impact**: Does this change development workflows?
- **System Impact**: Could this affect performance or reliability?

### **Step 4: Make Recommendation**
```text
✅ APPLY: Safe addition that improves project without risks
⚠️ TEST: Apply with thorough testing and monitoring  
🔶 REVIEW: Present to user with detailed risk/benefit analysis
🚫 SKIP: Too risky or not applicable to this project
```

### **Step 5: Document Decision**
Log the reasoning for each upgrade decision in TaskMaster subtask details for later review and learning.
