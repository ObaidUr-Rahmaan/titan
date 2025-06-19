---
description:
globs:
alwaysApply: false
---
# Analysis Domains for Titan Upgrades

These are the systematic domains to analyze when comparing an evolved project against current Titan.

## **Core Infrastructure Domains**

### **1. Authentication System**
- **Files to Compare**: `middleware.ts`, `app/(auth)/`, `lib/supabase/`, `utils/actions/user/`
- **Look For**:
  - Clerk version upgrades and new features
  - Improved middleware patterns
  - Better session handling
  - Enhanced user profile management
  - Multi-factor authentication implementations
  - Role-based access control improvements

### **2. Payment System**
- **Files to Compare**: `app/api/payments/`, `utils/actions/payments/`, Stripe configurations
- **Look For**:
  - Auto upgrade/downgrade scripts
  - Better webhook handling
  - Improved subscription management
  - Multi-currency support
  - Usage-based billing patterns
  - Payment retry logic
  - Dunning management

### **3. Database Layer**
- **Files to Compare**: `db/schema/`, `drizzle.config.ts`, `lib/drizzle/`, migration files
- **Look For**:
  - Schema improvements and optimizations
  - Better migration patterns
  - Enhanced query patterns
  - Connection pooling optimizations
  - Database backup strategies
  - Soft delete implementations
  - Audit trail patterns

### **4. Email System**
- **Files to Compare**: Email templates, `lib/` email configs, `utils/actions/email/`
- **Look For**:
  - Better template management
  - Improved email scheduling
  - Enhanced deliverability patterns
  - Multi-language email support
  - Email analytics integration
  - Transactional email improvements

## **Development Experience Domains**

### **5. Scripts & Tooling**
- **Files to Compare**: `package.json`, `scripts/`, build configs, deployment scripts
- **Look For**:
  - Useful automation scripts
  - Better build optimizations
  - Development workflow improvements
  - Testing setup enhancements
  - Deployment automation
  - Database seeding scripts
  - Environment management tools

### **6. Component Library & UI**
- **Files to Compare**: `components/`, `app/` layouts, styling configs
- **Look For**:
  - Reusable component patterns
  - Better accessibility implementations
  - Enhanced responsive design
  - Improved loading states
  - Better error boundaries
  - Animation and interaction improvements
  - Dark mode implementations

### **7. Configuration & Infrastructure**
- **Files to Compare**: Config files, environment setups, deployment configs
- **Look For**:
  - Better environment variable management
  - Improved TypeScript configurations
  - Enhanced linting and formatting rules
  - Security header optimizations
  - Performance monitoring setups
  - CDN and caching strategies

## **Quality & Performance Domains**

### **8. Error Handling & Monitoring**
- **Files to Compare**: Error components, monitoring setups, logging configurations
- **Look For**:
  - Better error boundary patterns
  - Improved logging strategies
  - Performance monitoring integrations
  - User feedback mechanisms
  - Crash reporting setups
  - Debug tooling improvements

### **9. Testing Patterns**
- **Files to Compare**: Test files, testing configs, CI/CD setups
- **Look For**:
  - Comprehensive test patterns
  - Better mock strategies
  - E2E testing improvements
  - Visual regression testing
  - Performance testing setups
  - Test data management

### **10. Performance Optimizations**
- **Files to Compare**: `next.config.js`, image configs, caching setups
- **Look For**:
  - Bundle optimization strategies
  - Image optimization improvements
  - Lazy loading implementations
  - Code splitting patterns
  - Service worker setups
  - Cache invalidation strategies

### **11. Security Implementations**
- **Files to Compare**: Security configs, validation schemas, protection middleware
- **Look For**:
  - Enhanced input validation
  - CSRF protection improvements
  - Rate limiting implementations
  - Security header optimizations
  - Data encryption patterns
  - Compliance implementations (GDPR, etc.)

## **User Experience Domains**

### **12. UX Patterns & Flows**
- **Files to Compare**: User flow components, onboarding, interaction patterns
- **Look For**:
  - Better onboarding flows
  - Enhanced loading states
  - Improved empty states
  - Better error feedback
  - Accessibility improvements
  - Mobile interaction patterns

### **13. Analytics & Tracking**
- **Files to Compare**: Analytics configs, tracking implementations, event handlers
- **Look For**:
  - Event tracking setups
  - A/B testing frameworks
  - Feature flag implementations
  - User behavior analytics
  - Conversion funnel tracking
  - Performance analytics

## **Integration Domains**

### **14. API & Third-Party Integrations**
- **Files to Compare**: `app/api/`, external service integrations, webhook handlers
- **Look For**:
  - API versioning strategies
  - Better webhook handling
  - Third-party service wrappers
  - Rate limiting implementations
  - API documentation improvements
  - Error handling for external services

### **15. Background Jobs & Automation**
- **Files to Compare**: Job queues, cron setups, automation scripts
- **Look For**:
  - Background job patterns
  - Queue implementations
  - Scheduled task setups
  - Data cleanup routines
  - Automated backup systems
  - Health check implementations

### **16. SEO & Meta Management**
- **Files to Compare**: Meta tag implementations, sitemap generation, SEO configs
- **Look For**:
  - Dynamic meta tag patterns
  - Sitemap generation improvements
  - Schema markup implementations
  - Open Graph optimizations
  - Social media integration
  - Search engine optimization

### **17. Mobile & PWA**
- **Files to Compare**: PWA configs, mobile-specific components, responsive patterns
- **Look For**:
  - PWA implementations
  - Mobile-first patterns
  - Touch interaction improvements
  - Offline functionality
  - Push notification setups
  - App store optimization

## **Analysis Instructions**
For each domain:
1. **Compare file by file** between evolved project and current Titan
2. **Document specific improvements** with exact file paths and code examples
3. **Assess migration complexity** - easy, medium, hard
4. **Consider backward compatibility** - any breaking changes?
5. **Evaluate impact** - high, medium, low value for future projects
