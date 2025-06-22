'server only';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { createDirectClient } from '@/lib/drizzle';
import { users, organizations, organizationMemberships } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { headers } from 'next/headers';
import type { User } from '@clerk/nextjs/server';

// Types for organization context
export interface OrganizationContext {
  organization: {
    id: string;
    name: string;
    slug: string;
    role: string;
    permissions: string[];
  };
  user: {
    id: string;
    clerkId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  membership: {
    role: string;
    joinedAt: Date;
    permissions: string[];
    status: string;
  };
}

export interface OrganizationMembershipInfo {
  id: number;
  role: string;
  status: string | null;
  joinedAt: Date;
  permissions: string[];
  organization: {
    id: number;
    clerkOrganizationId: string;
    name: string;
    slug: string;
  };
}

// Error types
export class OrganizationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'OrganizationError';
  }
}

/**
 * Get current user's organization context from Clerk and database
 * @param orgId Optional specific organization ID to check
 * @returns Organization context or null if not in organization
 */
export async function getOrganizationContext(orgId?: string): Promise<OrganizationContext | null> {
  // Force headers evaluation first
  await headers();
  
  const { userId, orgSlug } = await auth();
  
  if (!userId) {
    throw new OrganizationError('User not authenticated', 'UNAUTHENTICATED');
  }

  // Get organization info from Clerk
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  
  if (!clerkUser) {
    throw new OrganizationError('User not found in Clerk', 'USER_NOT_FOUND');
  }

  // If no org context in Clerk, return null
  if (!orgSlug && !orgId) {
    return null;
  }

  try {
    const db = createDirectClient();
    
    // Get user from our database
    const [dbUser] = await db.select()
      .from(users)
      .where(eq(users.clerkUserId, userId));

    if (!dbUser) {
      throw new OrganizationError('User not found in database', 'USER_NOT_IN_DB');
    }

    // Determine which organization to query
    let targetOrgSlug = orgSlug;
    if (orgId) {
      // If specific orgId provided, get org info from Clerk
      const clerkOrg = await client.organizations.getOrganization({ organizationId: orgId });
      targetOrgSlug = clerkOrg.slug;
    }

    if (!targetOrgSlug) {
      return null;
    }

    // Get organization and membership info from database
    const [orgData] = await db.select({
      org: organizations,
      membership: organizationMemberships
    })
    .from(organizations)
    .innerJoin(organizationMemberships, eq(organizationMemberships.organizationId, organizations.id))
    .where(
      and(
        eq(organizations.slug, targetOrgSlug),
        eq(organizationMemberships.userId, dbUser.id),
        eq(organizationMemberships.status, 'active')
      )
    );

    if (!orgData) {
      throw new OrganizationError('Organization membership not found', 'MEMBERSHIP_NOT_FOUND');
    }

    // Parse permissions from JSON
    let permissions: string[] = [];
    try {
      permissions = orgData.membership.permissions ? JSON.parse(orgData.membership.permissions) : [];
    } catch (_e) {
      console.warn('Failed to parse permissions JSON:', orgData.membership.permissions);
      permissions = [];
    }

    return {
      organization: {
        id: orgData.org.clerkOrganizationId,
        name: orgData.org.name,
        slug: orgData.org.slug,
        role: orgData.membership.role,
        permissions
      },
      user: {
        id: dbUser.id.toString(),
        clerkId: userId,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName
      },
      membership: {
        role: orgData.membership.role,
        joinedAt: orgData.membership.createdTime || new Date(),
        permissions,
        status: orgData.membership.status || 'active'
      }
    };

  } catch (error) {
    if (error instanceof OrganizationError) {
      throw error;
    }
    console.error('Error getting organization context:', error);
    throw new OrganizationError('Failed to get organization context', 'INTERNAL_ERROR');
  }
}

/**
 * Require organization context - throws error if user not in organization
 * @param orgId Optional specific organization ID to require
 * @returns Organization context (guaranteed to be non-null)
 */
export async function requireOrganization(orgId?: string): Promise<OrganizationContext> {
  const context = await getOrganizationContext(orgId);
  
  if (!context) {
    throw new OrganizationError('Organization context required', 'NO_ORGANIZATION');
  }
  
  return context;
}

/**
 * Check if user has specific permission in organization
 * @param permission Permission string to check
 * @param orgId Optional specific organization ID
 * @returns True if user has permission
 */
export async function hasPermission(permission: string, orgId?: string): Promise<boolean> {
  try {
    const context = await getOrganizationContext(orgId);
    
    if (!context) {
      return false;
    }
    
    // Check if user has the specific permission
    return context.organization.permissions.includes(permission);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Check if user has specific role in organization
 * @param role Role string to check (owner, admin, billing_manager, project_manager, developer, viewer)
 * @param orgId Optional specific organization ID
 * @returns True if user has role
 */
export async function hasRole(role: string, orgId?: string): Promise<boolean> {
  try {
    const context = await getOrganizationContext(orgId);
    
    if (!context) {
      return false;
    }
    
    return context.organization.role === role;
  } catch (error) {
    console.error('Error checking role:', error);
    return false;
  }
}

/**
 * Check if user has minimum role level in organization
 * @param minRole Minimum role required
 * @param orgId Optional specific organization ID
 * @returns True if user has minimum role level
 */
export async function hasMinRole(minRole: string, orgId?: string): Promise<boolean> {
  const roleHierarchy = {
    'viewer': 1,
    'developer': 2,
    'project_manager': 3,
    'billing_manager': 4,
    'admin': 5,
    'owner': 6
  };

  try {
    const context = await getOrganizationContext(orgId);
    
    if (!context) {
      return false;
    }
    
    const userRoleLevel = roleHierarchy[context.organization.role as keyof typeof roleHierarchy] || 0;
    const minRoleLevel = roleHierarchy[minRole as keyof typeof roleHierarchy] || 0;
    
    return userRoleLevel >= minRoleLevel;
  } catch (error) {
    console.error('Error checking minimum role:', error);
    return false;
  }
}

/**
 * Get all organization memberships for current user
 * @returns Array of organization memberships
 */
export async function getUserOrganizations(): Promise<OrganizationMembershipInfo[]> {
  await headers();
  
  const { userId } = await auth();
  
  if (!userId) {
    throw new OrganizationError('User not authenticated', 'UNAUTHENTICATED');
  }

  try {
    const db = createDirectClient();
    
    // Get user from our database
    const [dbUser] = await db.select()
      .from(users)
      .where(eq(users.userId, userId));

    if (!dbUser) {
      throw new OrganizationError('User not found in database', 'USER_NOT_IN_DB');
    }

    // Get all organization memberships
    const memberships = await db.select({
      membership: organizationMemberships,
      organization: organizations
    })
    .from(organizationMemberships)
    .innerJoin(organizations, eq(organizationMemberships.organizationId, organizations.id))
    .where(
      and(
        eq(organizationMemberships.userId, dbUser.id),
        eq(organizationMemberships.status, 'active')
      )
    );

    return memberships.map(({ membership, organization }) => {
      let permissions: string[] = [];
      try {
        permissions = membership.permissions ? JSON.parse(membership.permissions) : [];
      } catch (_e) {
        console.warn('Failed to parse permissions JSON:', membership.permissions);
        permissions = [];
      }

      return {
        id: membership.id,
        role: membership.role,
        status: membership.status,
        joinedAt: membership.createdTime || new Date(),
        permissions,
        organization: {
          id: organization.id,
          clerkOrganizationId: organization.clerkOrganizationId,
          name: organization.name,
          slug: organization.slug
        }
      };
    });

  } catch (error) {
    if (error instanceof OrganizationError) {
      throw error;
    }
    console.error('Error getting user organizations:', error);
    throw new OrganizationError('Failed to get user organizations', 'INTERNAL_ERROR');
  }
}

/**
 * Get organization by slug
 * @param slug Organization slug
 * @returns Organization data or null if not found
 */
export async function getOrganizationBySlug(slug: string) {
  await headers();
  
  try {
    const db = createDirectClient();
    
    const [org] = await db.select()
      .from(organizations)
      .where(eq(organizations.slug, slug));

    return org || null;
  } catch (error) {
    console.error('Error getting organization by slug:', error);
    return null;
  }
}

/**
 * Check if user is authenticated (has valid Clerk session)
 * @returns True if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  await headers();
  
  try {
    const { userId } = await auth();
    return !!userId;
  } catch (_error) {
    return false;
  }
}

/**
 * Get current user info from Clerk
 * @returns Clerk user object or null if not authenticated
 */
export async function getCurrentUser(): Promise<User | null> {
  await headers();
  
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return null;
    }
    
    const client = await clerkClient();
    return await client.users.getUser(userId);
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Get user by Clerk ID with error handling
 * @param clerkUserId Clerk user ID
 * @returns User data or throws error
 */
export async function getUserById(clerkUserId: string) {
  await headers();
  
  try {
    const client = await clerkClient();
    return await client.users.getUser(clerkUserId);
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw new OrganizationError('User not found', 'USER_NOT_FOUND');
  }
} 