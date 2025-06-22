'use server';

import { auth } from '@clerk/nextjs/server';
import { createDirectClient } from '@/lib/drizzle';
import { organizations, organizationMemberships, users } from '@/db/schema';
import { eq, and, ilike, desc, asc, count } from 'drizzle-orm';
import { headers } from 'next/headers';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Updated schema for validation
const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  websiteUrl: z.string().url('Invalid website URL').optional().or(z.literal('')),
  clerkOrganizationId: z.string().min(1, 'Clerk organization ID is required'),
});

const updateOrganizationSchema = createOrganizationSchema.partial().omit({ clerkOrganizationId: true });

const organizationQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'createdTime', 'updatedTime']).default('createdTime'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Types for return values
export interface OrganizationWithMembership {
  id: number;
  name: string;
  description: string | null;
  websiteUrl: string | null;
  clerkOrganizationId: string;
  slug: string;
  createdTime: Date | null;
  updatedTime: Date | null;
  logoUrl: string | null;
  subscriptionStatus: string | null;
  subscriptionTier: string | null;
  membership?: {
    role: string;
    joinedAt: Date | null;
  };
}

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get all organizations for the current user
 */
export async function getOrganizations(
  filters?: z.infer<typeof organizationQuerySchema>
): Promise<ActionResult<{ organizations: OrganizationWithMembership[]; total: number }>> {
  await headers();
  
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'You must be signed in' };
  }

  try {
    const db = createDirectClient();
    
    // Parse and validate filters
    const validatedFilters = organizationQuerySchema.parse(filters || {});
    const { page, limit, search, sortBy, sortOrder } = validatedFilters;
    
    // Get user database ID first
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.userId, userId));

    if (!user) {
      return { success: false, error: 'User not found in database' };
    }

    // Build base query
    let baseQuery = db
      .select({
        organization: organizations,
        membership: organizationMemberships,
      })
      .from(organizations)
      .innerJoin(organizationMemberships, eq(organizationMemberships.organizationId, organizations.id))
      .where(eq(organizationMemberships.userId, user.id));

    // Add search filter if provided
    if (search) {
      baseQuery = db
        .select({
          organization: organizations,
          membership: organizationMemberships,
        })
        .from(organizations)
        .innerJoin(organizationMemberships, eq(organizationMemberships.organizationId, organizations.id))
        .where(and(
          eq(organizationMemberships.userId, user.id),
          ilike(organizations.name, `%${search}%`)
        ));
    }

    // Execute query with sorting and pagination
    const sortColumn = sortBy === 'createdTime' ? organizations.createdTime : 
                      sortBy === 'updatedTime' ? organizations.updatedTime : 
                      organizations.name;
    const orderFn = sortOrder === 'asc' ? asc : desc;
    
    const offset = (page - 1) * limit;
    const results = await baseQuery
      .orderBy(orderFn(sortColumn))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [totalResult] = await db
      .select({ count: count() })
      .from(organizations)
      .innerJoin(organizationMemberships, eq(organizationMemberships.organizationId, organizations.id))
      .where(eq(organizationMemberships.userId, user.id));

    const organizationsData: OrganizationWithMembership[] = results.map(result => ({
      id: result.organization.id,
      name: result.organization.name,
      description: result.organization.description,
      websiteUrl: result.organization.websiteUrl,
      clerkOrganizationId: result.organization.clerkOrganizationId,
      slug: result.organization.slug,
      createdTime: result.organization.createdTime,
      updatedTime: result.organization.updatedTime,
      logoUrl: result.organization.logoUrl,
      subscriptionStatus: result.organization.subscriptionStatus,
      subscriptionTier: result.organization.subscriptionTier,
      membership: {
        role: result.membership.role,
        joinedAt: result.membership.joinedAt,
      },
    }));

    return {
      success: true,
      data: {
        organizations: organizationsData,
        total: totalResult.count,
      },
    };
  } catch (error: any) {
    console.error('Error fetching organizations:', error);
    return { success: false, error: 'Failed to fetch organizations' };
  }
}

/**
 * Get a specific organization by slug
 */
export async function getOrganizationBySlug(slug: string): Promise<ActionResult<OrganizationWithMembership>> {
  await headers();
  
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'You must be signed in' };
  }

  try {
    const db = createDirectClient();

    // Get user database ID first
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkUserId, userId));

    if (!user) {
      return { success: false, error: 'User not found in database' };
    }

    const [result] = await db
      .select({
        organization: organizations,
        membership: organizationMemberships,
      })
      .from(organizations)
      .innerJoin(organizationMemberships, eq(organizationMemberships.organizationId, organizations.id))
      .where(
        and(
          eq(organizations.slug, slug),
          eq(organizationMemberships.userId, user.id)
        )
      );

    if (!result) {
      return { success: false, error: 'Organization not found or access denied' };
    }

    const organizationData: OrganizationWithMembership = {
      id: result.organization.id,
      name: result.organization.name,
      description: result.organization.description,
      websiteUrl: result.organization.websiteUrl,
      clerkOrganizationId: result.organization.clerkOrganizationId,
      slug: result.organization.slug,
      createdTime: result.organization.createdTime,
      updatedTime: result.organization.updatedTime,
      logoUrl: result.organization.logoUrl,
      subscriptionStatus: result.organization.subscriptionStatus,
      subscriptionTier: result.organization.subscriptionTier,
      membership: {
        role: result.membership.role,
        joinedAt: result.membership.joinedAt,
      },
    };

    return { success: true, data: organizationData };
  } catch (error: any) {
    console.error('Error fetching organization by slug:', error);
    return { success: false, error: 'Failed to fetch organization' };
  }
}

/**
 * Get a specific organization by ID
 */
export async function getOrganizationById(organizationId: number): Promise<ActionResult<OrganizationWithMembership>> {
  await headers();
  
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'You must be signed in' };
  }

  try {
    const db = createDirectClient();

    // Get user database ID first
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.userId, userId));

    if (!user) {
      return { success: false, error: 'User not found in database' };
    }

    const [result] = await db
      .select({
        organization: organizations,
        membership: organizationMemberships,
      })
      .from(organizations)
      .innerJoin(organizationMemberships, eq(organizationMemberships.organizationId, organizations.id))
      .where(
        and(
          eq(organizations.id, organizationId),
          eq(organizationMemberships.userId, user.id)
        )
      );

    if (!result) {
      return { success: false, error: 'Organization not found or access denied' };
    }

    const organizationData: OrganizationWithMembership = {
      id: result.organization.id,
      name: result.organization.name,
      description: result.organization.description,
      websiteUrl: result.organization.websiteUrl,
      clerkOrganizationId: result.organization.clerkOrganizationId,
      slug: result.organization.slug,
      createdTime: result.organization.createdTime,
      updatedTime: result.organization.updatedTime,
      logoUrl: result.organization.logoUrl,
      subscriptionStatus: result.organization.subscriptionStatus,
      subscriptionTier: result.organization.subscriptionTier,
      membership: {
        role: result.membership.role,
        joinedAt: result.membership.joinedAt,
      },
    };

    return { success: true, data: organizationData };
  } catch (error: any) {
    console.error('Error fetching organization:', error);
    return { success: false, error: 'Failed to fetch organization' };
  }
}

/**
 * Create a new organization
 */
export async function createOrganization(
  data: z.infer<typeof createOrganizationSchema>
): Promise<ActionResult<OrganizationWithMembership>> {
  await headers();
  
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'You must be signed in' };
  }

  try {
    // Validate input data
    const validatedData = createOrganizationSchema.parse(data);
    
    const db = createDirectClient();

    // Get user database ID
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.userId, userId));

    if (!user) {
      return { success: false, error: 'User not found in database' };
    }

    // Create organization
    const [newOrg] = await db
      .insert(organizations)
      .values({
        name: validatedData.name,
        description: validatedData.description || null,
        websiteUrl: validatedData.websiteUrl || null,
        clerkOrganizationId: validatedData.clerkOrganizationId,
        slug: validatedData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
        createdTime: new Date(),
      })
      .returning();

    // Add creator as admin member
    await db
      .insert(organizationMemberships)
      .values({
        organizationId: newOrg.id,
        userId: user.id,
        clerkOrganizationId: validatedData.clerkOrganizationId,
        clerkUserId: userId,
        role: 'admin',
        status: 'active',
        joinedAt: new Date(),
        createdTime: new Date(),
      });

    const organizationData: OrganizationWithMembership = {
      id: newOrg.id,
      name: newOrg.name,
      description: newOrg.description,
      websiteUrl: newOrg.websiteUrl,
      clerkOrganizationId: newOrg.clerkOrganizationId,
      slug: newOrg.slug,
      createdTime: newOrg.createdTime,
      updatedTime: newOrg.updatedTime,
      logoUrl: newOrg.logoUrl,
      subscriptionStatus: newOrg.subscriptionStatus,
      subscriptionTier: newOrg.subscriptionTier,
      membership: {
        role: 'admin',
        joinedAt: new Date(),
      },
    };

    revalidatePath('/dashboard');
    return { success: true, data: organizationData };
  } catch (error: any) {
    console.error('Error creating organization:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: `Invalid input data: ${error.issues.map(i => i.message).join(', ')}` };
    }
    return { success: false, error: 'Failed to create organization' };
  }
}

/**
 * Update an organization
 */
export async function updateOrganization(
  organizationId: number,
  data: z.infer<typeof updateOrganizationSchema>
): Promise<ActionResult<OrganizationWithMembership>> {
  await headers();
  
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'You must be signed in' };
  }

  try {
    // Validate input data
    const validatedData = updateOrganizationSchema.parse(data);
    
    const db = createDirectClient();

    // Get user database ID
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.userId, userId));

    if (!user) {
      return { success: false, error: 'User not found in database' };
    }

    // Check if user has admin role in organization
    const [membership] = await db
      .select({ role: organizationMemberships.role })
      .from(organizationMemberships)
      .where(
        and(
          eq(organizationMemberships.organizationId, organizationId),
          eq(organizationMemberships.userId, user.id)
        )
      );

    if (!membership) {
      return { success: false, error: 'Organization not found or access denied' };
    }

    if (membership.role !== 'admin' && membership.role !== 'owner') {
      return { success: false, error: 'Admin or owner role required to update organization' };
    }

    // Update organization
    const updateData: Record<string, any> = {
      updatedTime: new Date(),
    };

    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.websiteUrl !== undefined) updateData.websiteUrl = validatedData.websiteUrl;

    const [updatedOrg] = await db
      .update(organizations)
      .set(updateData)
      .where(eq(organizations.id, organizationId))
      .returning();

    if (!updatedOrg) {
      return { success: false, error: 'Failed to update organization' };
    }

    const organizationData: OrganizationWithMembership = {
      id: updatedOrg.id,
      name: updatedOrg.name,
      description: updatedOrg.description,
      websiteUrl: updatedOrg.websiteUrl,
      clerkOrganizationId: updatedOrg.clerkOrganizationId,
      slug: updatedOrg.slug,
      createdTime: updatedOrg.createdTime,
      updatedTime: updatedOrg.updatedTime,
      logoUrl: updatedOrg.logoUrl,
      subscriptionStatus: updatedOrg.subscriptionStatus,
      subscriptionTier: updatedOrg.subscriptionTier,
      membership: {
        role: membership.role,
        joinedAt: new Date(), // Would need to fetch actual joinedAt if needed
      },
    };

    revalidatePath('/dashboard');
    return { success: true, data: organizationData };
  } catch (error: any) {
    console.error('Error updating organization:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data: ' + error.issues.map(i => i.message).join(', ') };
    }
    return { success: false, error: 'Failed to update organization' };
  }
}

/**
 * Delete an organization (soft delete)
 */
export async function deleteOrganization(organizationId: number): Promise<ActionResult<boolean>> {
  await headers();
  
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'You must be signed in' };
  }

  try {
    const db = createDirectClient();

    // Get user database ID
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.userId, userId));

    if (!user) {
      return { success: false, error: 'User not found in database' };
    }

    // Check if user has owner/admin role in organization
    const [membership] = await db
      .select({ role: organizationMemberships.role })
      .from(organizationMemberships)
      .where(
        and(
          eq(organizationMemberships.organizationId, organizationId),
          eq(organizationMemberships.userId, user.id)
        )
      );

    if (!membership) {
      return { success: false, error: 'Organization not found or access denied' };
    }

    if (membership.role !== 'owner' && membership.role !== 'admin') {
      return { success: false, error: 'Owner or admin role required to delete organization' };
    }

    // Soft delete organization
    await db
      .update(organizations)
      .set({
        deletedAt: new Date(),
        isActive: false,
        updatedTime: new Date(),
      })
      .where(eq(organizations.id, organizationId));

    revalidatePath('/dashboard');
    return { success: true, data: true };
  } catch (error: any) {
    console.error('Error deleting organization:', error);
    return { success: false, error: 'Failed to delete organization' };
  }
}

/**
 * Get organization members
 */
export async function getOrganizationMembers(organizationId: number): Promise<ActionResult<any[]>> {
  await headers();
  
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'You must be signed in' };
  }

  try {
    const db = createDirectClient();

    // Get user database ID
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.userId, userId));

    if (!user) {
      return { success: false, error: 'User not found in database' };
    }

    // Check if user has access to organization
    const [membership] = await db
      .select({ role: organizationMemberships.role })
      .from(organizationMemberships)
      .where(
        and(
          eq(organizationMemberships.organizationId, organizationId),
          eq(organizationMemberships.userId, user.id)
        )
      );

    if (!membership) {
      return { success: false, error: 'Organization not found or access denied' };
    }

    // Get all members of the organization
    const members = await db
      .select({
        membership: organizationMemberships,
        user: users,
      })
      .from(organizationMemberships)
      .innerJoin(users, eq(users.id, organizationMemberships.userId))
      .where(eq(organizationMemberships.organizationId, organizationId));

    const membersData = members.map(member => ({
      id: member.membership.id,
      userId: member.user.id,
      clerkUserId: member.user.userId,
      email: member.user.email,
      firstName: member.user.firstName,
      lastName: member.user.lastName,
      role: member.membership.role,
      status: member.membership.status,
      joinedAt: member.membership.joinedAt,
      lastActiveAt: member.membership.lastActiveAt,
    }));

    return { success: true, data: membersData };
  } catch (error: any) {
    console.error('Error fetching organization members:', error);
    return { success: false, error: 'Failed to fetch organization members' };
  }
} 