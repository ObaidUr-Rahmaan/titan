# Adding Organizations as First-Class Citizens for B2B Apps with Clerk

## Executive Summary

This document provides a comprehensive implementation plan for transforming your individual user-focused SaaS application into a full-fledged B2B platform using Clerk's organizations feature. The implementation will add multi-tenant capabilities, role-based access control (RBAC), and team collaboration features while maintaining backward compatibility.

## Current State Analysis

### Existing Clerk Implementation
- **Clerk Version**: v6.22.0 (supports full B2B organizations)
- **Authentication Type**: Individual users only
- **Components Used**: SignIn, SignUp, UserProfile
- **Database Integration**: PostgreSQL with Drizzle ORM
- **Subscription Model**: Individual user subscriptions via Stripe

### Current Database Schema
- **Users Table**: Contains trial/subscription fields
- **Billing Tables**: payments, subscriptions, invoices, refunds
- **No Organization Relationships**: All data scoped to individual users

### Existing Infrastructure
- ✅ Authentication wrapper (`auth-wrapper.tsx`)
- ✅ Middleware protection (`middleware.ts`)
- ✅ Webhook handlers (`api/auth/webhook/route.ts`)
- ✅ RLS policies and audit scripts
- ✅ Subscription management system

## Clerk Organizations Research & Capabilities

### Feature Overview
Clerk's organizations provide enterprise-grade multi-tenancy with:
- **Hierarchical Structure**: Organizations → Members → Roles → Permissions
- **Pre-built Components**: OrganizationSwitcher, CreateOrganization, OrganizationProfile
- **Default Roles**: `org:admin`, `org:member`
- **Custom Roles**: Up to 10 additional roles per organization
- **Permissions**: Custom format `org:<feature>:<action>`
- **Domain Verification**: Email domain-based auto-joining
- **SSO Integration**: SAML/OIDC for enterprise customers

### JWT Token Structure
```json
{
  "o": {
    "id": "org_2abcdef123456789",
    "slug": "my-company",
    "role": "org:admin",
    "permissions": ["org:billing:manage", "org:members:invite"]
  }
}
```

### Pricing Impact
- **Free Tier**: 100 MAOs (Monthly Active Organizations), 5 members/org
- **Pro Tier**: $25/month + $1 per MAO
- **Enhanced B2B Add-on**: $100/month (SSO, advanced security)

## Implementation Strategy

### Phase 1: Clerk Dashboard Configuration (Week 1)

#### 1.1 Enable Organizations Feature
1. Navigate to Clerk Dashboard → Settings → Features
2. Enable "Organizations" feature
3. Configure organization settings:
   - Enable member invitations
   - Set default role: `org:member`
   - Enable organization creation for users

#### 1.2 Create Custom Roles
```javascript
// In Clerk Dashboard → Organizations → Roles
const customRoles = [
  {
    key: "org:owner",
    name: "Owner",
    description: "Full access to organization and billing"
  },
  {
    key: "org:billing_manager", 
    name: "Billing Manager",
    description: "Manage subscriptions and billing"
  },
  {
    key: "org:project_manager",
    name: "Project Manager", 
    description: "Manage projects and assign tasks"
  },
  {
    key: "org:developer",
    name: "Developer",
    description: "Access to development resources"
  },
  {
    key: "org:viewer",
    name: "Viewer",
    description: "Read-only access to organization data"
  }
];
```

#### 1.3 Define Custom Permissions
```javascript
// Format: org:<feature>:<action>
const permissions = [
  // Billing permissions
  "org:billing:read",
  "org:billing:manage", 
  "org:billing:cancel",
  
  // Member management
  "org:members:read",
  "org:members:invite",
  "org:members:remove",
  "org:members:manage_roles",
  
  // Project permissions  
  "org:projects:read",
  "org:projects:create",
  "org:projects:edit",
  "org:projects:delete",
  
  // Settings permissions
  "org:settings:read",
  "org:settings:manage"
];
```

#### 1.4 Role-Permission Matrix
| Role | Billing | Members | Projects | Settings |
|------|---------|---------|----------|----------|
| Owner | All | All | All | All |
| Billing Manager | All | Read | Read | Read |
| Project Manager | Read | Invite/Read | All | Read |
| Developer | Read | Read | Read/Create/Edit | Read |
| Viewer | Read | Read | Read | Read |

### Phase 2: Database Schema Updates (Week 1-2)

#### 2.1 New Schema Files

**`db/schema/organizations.ts`**
```typescript
import { pgTable, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const organizations = pgTable('organizations', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  clerkId: text('clerk_id').notNull().unique(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  logoUrl: text('logo_url'),
  domain: text('domain'),
  domainVerified: boolean('domain_verified').default(false),
  maxMembers: integer('max_members').default(5),
  planType: text('plan_type').default('free'), // free, pro, enterprise
  stripeCustomerId: text('stripe_customer_id'),
  trialEndsAt: timestamp('trial_ends_at'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const organizationMemberships = pgTable('organization_memberships', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  clerkId: text('clerk_id').notNull().unique(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('org:member'),
  permissions: text('permissions').array(),
  invitedBy: text('invited_by').references(() => users.id),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const organizationInvitations = pgTable('organization_invitations', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  clerkId: text('clerk_id').notNull().unique(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role').notNull().default('org:member'),
  invitedBy: text('invited_by').notNull().references(() => users.id),
  status: text('status').notNull().default('pending'), // pending, accepted, revoked, expired
  expiresAt: timestamp('expires_at').notNull(),
  acceptedAt: timestamp('accepted_at'),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});
```

#### 2.2 Update Existing Schema Files

**Update existing tables to include organization_id**
```typescript
// Add to subscriptions, payments, invoices, etc.
organizationId: text('organization_id').references(() => organizations.id),
```

### Phase 3: Backend Implementation (Week 2-3)

#### 3.1 Enhanced Auth Utilities

**`utils/auth-helpers.ts`** (Enhanced)
```typescript
import { auth, clerkClient } from '@clerk/nextjs/server';
import { db } from '@/lib/drizzle';
import { organizations, organizationMemberships } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export interface OrganizationContext {
  organization: {
    id: string;
    clerkId: string;
    name: string;
    slug: string;
    role: string;
    permissions: string[];
  } | null;
  user: {
    id: string;
    clerkId: string;
  };
}

export async function getOrganizationContext(): Promise<OrganizationContext> {
  const { userId, orgId, orgRole, orgPermissions } = auth();
  
  if (!userId) {
    throw new Error('User not authenticated');
  }

  let organization = null;
  
  if (orgId) {
    // Get organization from database
    const [orgData] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.clerkId, orgId))
      .limit(1);

    if (orgData) {
      organization = {
        id: orgData.id,
        clerkId: orgData.clerkId,
        name: orgData.name,
        slug: orgData.slug,
        role: orgRole || 'org:member',
        permissions: orgPermissions || []
      };
    }
  }

  return {
    organization,
    user: { 
      id: userId, 
      clerkId: userId 
    }
  };
}

export async function requireOrganization(): Promise<OrganizationContext> {
  const context = await getOrganizationContext();
  
  if (!context.organization) {
    throw new Error('Organization context required');
  }
  
  return context;
}

export function hasPermission(permissions: string[], required: string): boolean {
  return permissions.includes(required) || permissions.includes('org:admin:all');
}
```

### Phase 4: Frontend Implementation (Week 3-4)

#### 4.1 Layout Updates

**`app/dashboard/layout.tsx`** (Enhanced)
```typescript
import { 
  OrganizationSwitcher, 
  UserButton,
  ClerkLoaded,
  ClerkLoading
} from '@clerk/nextjs';
import { DashboardSidebar } from './_components/dashboard-side-bar';
import { DashboardTopNav } from './_components/dashbord-top-nav';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardTopNav />
      
      <div className="flex">
        <DashboardSidebar />
        
        <main className="flex-1 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ClerkLoading>
                <Skeleton className="h-8 w-48" />
              </ClerkLoading>
              <ClerkLoaded>
                <OrganizationSwitcher 
                  appearance={{
                    elements: {
                      organizationSwitcherTrigger: 
                        "border border-gray-300 rounded-md px-3 py-2"
                    }
                  }}
                  createOrganizationMode="modal"
                  organizationProfileMode="modal"
                />
              </ClerkLoaded>
            </div>
            
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8"
                }
              }}
            />
          </div>
          
          {children}
        </main>
      </div>
    </div>
  );
}
```

### Phase 5: Data Access Control (Week 4)

#### 5.1 Database Query Helpers

**`utils/data/shared/organization-scoped-queries.ts`**
```typescript
import { and, eq } from 'drizzle-orm';
import { getOrganizationContext } from '@/utils/auth-helpers';

export async function createOrganizationScopedQuery<T>(
  baseQuery: T,
  table: { organizationId: any }
) {
  const context = await getOrganizationContext();
  
  if (!context.organization) {
    throw new Error('Organization context required for this operation');
  }

  return and(
    baseQuery,
    eq(table.organizationId, context.organization.id)
  );
}
```

### Phase 6: Billing & Subscription Updates (Week 4-5)

#### 6.1 Organization-Level Stripe Integration

**`utils/billing/organization-billing.ts`**
```typescript
import Stripe from 'stripe';
import { db } from '@/lib/drizzle';
import { organizations, subscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function createOrganizationCustomer(organizationId: string) {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);

  if (!org) {
    throw new Error('Organization not found');
  }

  // Create Stripe customer for organization
  const customer = await stripe.customers.create({
    name: org.name,
    metadata: {
      organizationId: org.id,
      clerkOrgId: org.clerkId
    }
  });

  // Update organization with Stripe customer ID
  await db
    .update(organizations)
    .set({ 
      stripeCustomerId: customer.id,
      updatedAt: new Date()
    })
    .where(eq(organizations.id, organizationId));

  return customer;
}
```

## Migration Timeline

### Week 1: Foundation
- ✅ Enable Clerk organizations
- ✅ Configure roles and permissions
- ✅ Update webhook configuration
- ✅ Create database schema
- ✅ Run migrations

### Week 2: Backend Core
- ✅ Implement auth utilities
- ✅ Create organization operations
- ✅ Update webhook handlers
- ✅ Add database utilities

### Week 3: Frontend Implementation  
- ✅ Update layouts with OrganizationSwitcher
- ✅ Create organization management pages
- ✅ Implement data filtering
- ✅ Update navigation

### Week 4: Data & Billing
- ✅ Implement RLS policies
- ✅ Update billing system
- ✅ Create migration scripts
- ✅ Test organization workflows

### Week 5: Polish & Security
- ✅ Performance optimization
- ✅ Security hardening
- ✅ Testing
- ✅ Documentation
- ✅ Launch preparation

## Success Metrics

### Adoption Metrics
- **Organization Creation Rate**: Target 40% of active users create orgs within 30 days
- **Team Invitation Rate**: Average 2.5 invitations per organization
- **Multi-Member Organizations**: 60% of orgs have >1 active member

### Business Metrics
- **ARPU Increase**: 25% increase in average revenue per user
- **Seat Expansion**: Average 3.2 paid seats per organization
- **Churn Reduction**: 15% reduction in churn rate

### Technical Metrics
- **Page Load Performance**: <200ms for organization-scoped queries
- **Error Rate**: <0.1% for organization operations
- **API Response Time**: <100ms for permission checks

## Configuration Updates

### Environment Variables (Updated)
```bash
# Add to .env
CLERK_ORGANIZATIONS_ENABLED=true
STRIPE_ORGANIZATION_WEBHOOK_SECRET=whsec_...

# Update existing
CLERK_WEBHOOK_SECRET=whsec_... # Updated to handle org events
```

### Feature Flags
```typescript
// config.ts (Updated)
export const features = {
  organizations: {
    enabled: process.env.CLERK_ORGANIZATIONS_ENABLED === 'true',
    maxMembers: {
      free: 5,
      pro: 25,
      enterprise: 100
    },
    customRoles: true,
    domainVerification: true
  }
};
```

## Conclusion

This implementation transforms your individual-focused SaaS into a robust B2B platform with enterprise-grade multi-tenancy. The phased approach ensures minimal disruption while providing comprehensive organization management capabilities.

Key benefits of this implementation:
- **Scalable Architecture**: Supports organizations from 1 to 100+ members
- **Enterprise-Ready**: RBAC, SSO compatibility, domain verification
- **Backward Compatible**: Existing users seamlessly migrate to personal orgs
- **Revenue Growth**: Enables team-based pricing and seat expansion
- **Security-First**: RLS policies and comprehensive access controls

The implementation leverages Clerk's mature organization system while maintaining your existing tech stack and architectural patterns. The result is a production-ready B2B SaaS platform that can compete with established players in your market.

---

## Boilerplate Strategy: B2C vs B2B CLI Selection

### Overview

Since this is a boilerplate project with no existing customers, the optimal approach is to create a **configurable architecture** where developers choose their billing model during project generation. This provides maximum value by generating exactly the right implementation without migration complexity.

### CLI Flow Design

```bash
npx create-titan my-app
? What type of app are you building?
  ❯ B2C (Individual users with personal subscriptions)
    B2B (Organizations with team subscriptions)
    Both (Advanced: Support both individual and organization billing)

# If B2B selected:
? What organization features do you need?
  ❯ ◉ Team billing (organization pays for all members)
    ◉ Role-based permissions (admin, billing, member, etc.)
    ◉ Member invitations
    ◉ SSO integration
    ◯ Domain verification
```

### Template Architecture

#### 1. **Conditional Schema Generation**

**B2C Version:**
```typescript
// db/schema/billing.ts (B2C)
export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id').notNull(), // Direct user billing
  subscriptionId: varchar('subscription_id').notNull(),
  stripeCustomerId: varchar('stripe_customer_id').notNull(),
  status: varchar('status').notNull(),
  planId: varchar('plan_id').notNull(),
  // ... rest of individual billing fields
});
```

**B2B Version:**
```typescript
// db/schema/billing.ts (B2B)
export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  organizationId: varchar('organization_id').notNull(), // Org billing
  subscriptionId: varchar('subscription_id').notNull(),
  stripeCustomerId: varchar('stripe_customer_id').notNull(),
  status: varchar('status').notNull(),
  planId: varchar('plan_id').notNull(),
  // ... rest of organization billing fields
});

// Plus organization-specific tables:
export const organizations = pgTable('organizations', { /* ... */ });
export const organizationMemberships = pgTable('organization_memberships', { /* ... */ });
```

#### 2. **Config-Driven Implementation**

```typescript
// config.ts (generated based on CLI choice)
export const config = {
  app: {
    type: 'B2B', // or 'B2C' or 'HYBRID'
  },
  billing: {
    model: 'organization', // or 'individual'
    requireOrgMembership: true,
    allowIndividualBilling: false,
  },
  organizations: {
    enabled: true,
    features: {
      memberInvites: true,
      roleBasedPermissions: true,
      ssoIntegration: false,
      domainVerification: false,
    }
  },
  clerk: {
    organizations: {
      enabled: true,
      maxMembersPerOrg: 25,
      customRoles: ['owner', 'billing_manager', 'project_manager', 'developer', 'viewer']
    }
  }
}
```

#### 3. **Payment Infrastructure Updates for B2B**

**Organization-First Billing Architecture:**
```typescript
// app/api/payments/create-checkout-session/route.ts (B2B version)
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  const { organizationId, priceId } = await req.json();
  
  // Verify user has billing permissions in org
  const orgMembership = await getOrganizationMembership(userId, organizationId);
  if (!canManageBilling(orgMembership.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  // Get organization's Stripe customer
  const organization = await getOrganization(organizationId);
  
  const session = await stripe.checkout.sessions.create({
    customer: organization.stripeCustomerId,
    metadata: { 
      organizationId,
      billingUserId: userId // Track who initiated billing
    },
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${baseUrl}/dashboard/organization/${organizationId}/billing/success`,
    cancel_url: `${baseUrl}/dashboard/organization/${organizationId}/billing`,
    // ... rest of config
  });

  return NextResponse.json({ sessionId: session.id });
}
```

**Clean Webhook Handling for Organizations:**
```typescript
// app/api/payments/webhook/route.ts (B2B version)
async function handleSubscriptionEvent(
  event: Stripe.Event,
  type: 'created' | 'updated' | 'deleted',
  supabase: SupabaseClient
) {
  const subscription = event.data.object as Stripe.Subscription;
  
  // Always expect organizationId in metadata for B2B
  const subscriptionData = {
    subscription_id: subscription.id,
    organization_id: subscription.metadata?.organizationId,
    stripe_customer_id: subscription.customer,
    status: subscription.status,
    plan_id: subscription.items.data[0]?.price.id,
    // No user_id needed at subscription level for org billing
  };

  // Insert/update organization subscription
  if (type === 'created') {
    await supabase.from('subscriptions').insert([subscriptionData]);
    await logOrganizationSubscriptionCreated(subscriptionData.organization_id, subscription.id);
  }
  // ... handle other events
}
```

#### 4. **Conditional Components**

```typescript
// components/billing/BillingWrapper.tsx
import { config } from '@/config';

export function BillingWrapper({ children }: { children: React.ReactNode }) {
  if (config.app.type === 'B2B') {
    return <OrganizationBillingProvider>{children}</OrganizationBillingProvider>;
  }
  
  return <IndividualBillingProvider>{children}</IndividualBillingProvider>;
}

// components/dashboard/DashboardHeader.tsx
export function DashboardHeader() {
  if (config.organizations.enabled) {
    return (
      <div className="flex items-center justify-between">
        <OrganizationSwitcher />
        <UserButton />
      </div>
    );
  }
  
  return <UserButton />;
}
```

### Template Structure

```
packages/create-titan/templates/
├── base/                        # Shared components & utilities
│   ├── components/ui/
│   ├── lib/
│   └── utils/
├── b2c/                         # B2C-specific implementations
│   ├── api/payments/
│   │   ├── create-checkout-session/
│   │   ├── create-portal-session/
│   │   └── webhook/
│   ├── components/billing/
│   │   ├── individual-billing-provider.tsx
│   │   └── subscription-card.tsx
│   ├── db/schema/
│   │   ├── subscriptions.ts
│   │   └── payments.ts
│   └── utils/billing/
│       └── individual-billing.ts
├── b2b/                         # B2B-specific implementations
│   ├── api/payments/
│   │   ├── create-checkout-session/    # Org-aware billing
│   │   ├── create-portal-session/
│   │   └── webhook/
│   ├── components/
│   │   ├── billing/
│   │   │   ├── organization-billing-provider.tsx
│   │   │   └── team-subscription-card.tsx
│   │   └── organization/
│   │       ├── organization-switcher.tsx
│   │       ├── member-management.tsx
│   │       └── role-assignment.tsx
│   ├── db/schema/
│   │   ├── organizations.ts
│   │   ├── organization-memberships.ts
│   │   ├── subscriptions.ts           # Org-scoped billing
│   │   └── payments.ts
│   └── utils/
│       ├── auth/
│       │   └── organization-auth.ts
│       └── billing/
│           └── organization-billing.ts
└── hybrid/                      # Support both models (advanced)
    ├── api/payments/
    ├── components/adaptive/
    └── utils/conditional/
```

### CLI Implementation

```typescript
// packages/create-titan/src/index.ts
interface AppOptions {
  appType: 'B2C' | 'B2B' | 'HYBRID';
  organizationFeatures?: {
    memberInvites: boolean;
    roleBasedPermissions: boolean;
    ssoIntegration: boolean;
    domainVerification: boolean;
  };
}

async function generateApp(appName: string, options: AppOptions) {
  // Copy base template
  const baseFiles = await copyTemplate('base');
  
  if (options.appType === 'B2C') {
    await copyTemplate('b2c');
    await generateConfig({ 
      billing: { model: 'individual' },
      organizations: { enabled: false }
    });
  } else if (options.appType === 'B2B') {
    await copyTemplate('b2b');
    await generateConfig({ 
      billing: { model: 'organization' },
      organizations: { 
        enabled: true,
        features: options.organizationFeatures 
      }
    });
    await setupClerkOrganizations();
  } else if (options.appType === 'HYBRID') {
    await copyTemplate('hybrid');
    await generateConfig({ 
      billing: { model: 'adaptive' },
      organizations: { enabled: true }
    });
  }
  
  await generateDatabase(options.appType);
  await updatePackageJson(options);
  await generateDocumentation(options.appType);
}
```

### Updated Payment Infrastructure Changes

#### B2B Database Schema Changes

**All billing tables need organization context:**
```typescript
// db/schema/subscriptions.ts (B2B version)
export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  organizationId: varchar('organization_id').notNull(), // Primary relationship
  subscriptionId: varchar('subscription_id').notNull(),
  stripeCustomerId: varchar('stripe_customer_id').notNull(),
  status: varchar('status').notNull(),
  planId: varchar('plan_id').notNull(),
  // Remove individual user_id - not needed for org billing
});

// db/schema/invoices.ts (B2B version)
export const invoices = pgTable('invoices', {
  // ... existing fields
  organizationId: varchar('organization_id').notNull(), // NEW: Link to organization
  billingUserId: varchar('billing_user_id'), // Track who initiated billing action
});

// db/schema/payments.ts (B2B version)  
export const payments = pgTable('payments', {
  // ... existing fields
  organizationId: varchar('organization_id').notNull(), // NEW: Organization context
});
```

#### Billing Portal Updates

```typescript
// app/api/payments/create-portal-session/route.ts (B2B version)
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  const { organizationId } = await req.json();
  
  // Verify billing permissions
  const membership = await getOrganizationMembership(userId, organizationId);
  if (!canManageBilling(membership.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  // Get organization's Stripe customer ID
  const organization = await getOrganization(organizationId);
  
  const session = await stripe.billingPortal.sessions.create({
    customer: organization.stripeCustomerId, // Org customer, not user
    return_url: `${baseUrl}/dashboard/organization/${organizationId}/billing`,
  });

  return NextResponse.json({ url: session.url });
}
```

### Benefits of CLI-Driven Approach

1. **Clean Separation** - No runtime conditional logic, just optimal implementations
2. **Optimized Bundles** - Only ship code needed for chosen billing model  
3. **Clear Documentation** - Each template has focused docs for its use case
4. **Easy Migration** - If needs change, regenerate with different template
5. **Best Practices** - Each template follows patterns optimal for that billing model
6. **No Migration Complexity** - Built right from the start for chosen model

### Developer Experience

```bash
# Developers get exactly what they need:
npx create-titan my-b2c-app --type=b2c
# Generates individual user billing, no organization complexity

npx create-titan my-b2b-app --type=b2b --features=rbac,invites,sso  
# Generates organization-first architecture with chosen features

npx create-titan my-flexible-app --type=hybrid
# Generates adaptive architecture supporting both models
```

This approach transforms the boilerplate into a **much more marketable offering** - developers get exactly the architecture they need without bloat from unused patterns, while maintaining the option to upgrade to more complex models if their requirements evolve. 