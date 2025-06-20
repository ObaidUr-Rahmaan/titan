'use server';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getOrganizationContext, requireOrganization, hasMinRole, hasPermission } from './organization-helpers';
import { getOrganizationBySlug } from '@/utils/actions/organizations';
import { isTrialExpiredForUser } from '@/utils/middleware/trial-check';

export interface RouteGuardResult {
  success: boolean;
  redirect?: string;
  error?: string;
  organizationId?: string;
  organizationSlug?: string;
  userRole?: string;
}

/**
 * Guard for organization-scoped routes
 * Validates user authentication, organization membership, and trial status
 */
export async function guardOrganizationRoute(
  orgSlug: string,
  options: {
    minRole?: string;
    requiredPermissions?: string[];
    redirectOnError?: boolean;
  } = {}
): Promise<RouteGuardResult> {
  const { minRole, requiredPermissions = [], redirectOnError = true } = options;

  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      if (redirectOnError) {
        redirect('/sign-in');
      }
      return { success: false, error: 'Not authenticated', redirect: '/sign-in' };
    }

    // Check trial status
    try {
      const trialExpired = await isTrialExpiredForUser(userId);
      if (trialExpired) {
        if (redirectOnError) {
          redirect('/trial-expired');
        }
        return { success: false, error: 'Trial expired', redirect: '/trial-expired' };
      }
    } catch (error) {
      console.error('Error checking trial status in route guard:', error);
      // Continue with organization validation
    }

    // Get organization and validate membership
    const orgResult = await getOrganizationBySlug(orgSlug);
    if (!orgResult.success || !orgResult.data) {
      if (redirectOnError) {
        redirect('/dashboard?error=organization-not-found');
      }
      return { 
        success: false, 
        error: 'Organization not found or access denied', 
        redirect: '/dashboard?error=organization-not-found' 
      };
    }

    const organization = orgResult.data;

    // Validate organization membership using requireOrganization
    try {
      await requireOrganization(organization.clerkOrganizationId);
    } catch (error) {
      if (redirectOnError) {
        redirect('/dashboard?error=access-denied');
      }
      return { 
        success: false, 
        error: 'Access denied to organization', 
        redirect: '/dashboard?error=access-denied' 
      };
    }

    // Check minimum role if specified
    if (minRole) {
      const hasValidRole = await hasMinRole(minRole, organization.clerkOrganizationId);
      if (!hasValidRole) {
        if (redirectOnError) {
          redirect(`/org/${orgSlug}/dashboard?error=insufficient-permissions`);
        }
        return { 
          success: false, 
          error: `Minimum role required: ${minRole}`, 
          redirect: `/org/${orgSlug}/dashboard?error=insufficient-permissions` 
        };
      }
    }

    // Check required permissions if specified
    for (const permission of requiredPermissions) {
      const hasValidPermission = await hasPermission(permission, organization.clerkOrganizationId);
      if (!hasValidPermission) {
        if (redirectOnError) {
          redirect(`/org/${orgSlug}/dashboard?error=insufficient-permissions`);
        }
        return { 
          success: false, 
          error: `Permission required: ${permission}`, 
          redirect: `/org/${orgSlug}/dashboard?error=insufficient-permissions` 
        };
      }
    }

    return {
      success: true,
      organizationId: organization.clerkOrganizationId,
      organizationSlug: orgSlug,
      userRole: organization.membership?.role
    };

  } catch (error) {
    console.error('Error in organization route guard:', error);
    if (redirectOnError) {
      redirect('/dashboard?error=system-error');
    }
    return { 
      success: false, 
      error: 'System error during access validation', 
      redirect: '/dashboard?error=system-error' 
    };
  }
}

/**
 * Guard for dashboard routes (personal or organization context)
 * Validates authentication and trial status
 */
export async function guardDashboardRoute(
  options: { redirectOnError?: boolean } = {}
): Promise<RouteGuardResult> {
  const { redirectOnError = true } = options;

  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      if (redirectOnError) {
        redirect('/sign-in');
      }
      return { success: false, error: 'Not authenticated', redirect: '/sign-in' };
    }

    // Check trial status
    try {
      const trialExpired = await isTrialExpiredForUser(userId);
      if (trialExpired) {
        if (redirectOnError) {
          redirect('/trial-expired');
        }
        return { success: false, error: 'Trial expired', redirect: '/trial-expired' };
      }
    } catch (error) {
      console.error('Error checking trial status in dashboard guard:', error);
      // Continue - fail open for trial check errors
    }

    return { success: true };

  } catch (error) {
    console.error('Error in dashboard route guard:', error);
    if (redirectOnError) {
      redirect('/dashboard?error=system-error');
    }
    return { 
      success: false, 
      error: 'System error during authentication', 
      redirect: '/dashboard?error=system-error' 
    };
  }
}

/**
 * Guard for admin-only organization routes
 * Validates admin or owner role in organization
 */
export async function guardOrganizationAdminRoute(
  orgSlug: string,
  options: { redirectOnError?: boolean } = {}
): Promise<RouteGuardResult> {
  return guardOrganizationRoute(orgSlug, {
    minRole: 'admin',
    redirectOnError: options.redirectOnError
  });
}

/**
 * Guard for billing-related organization routes
 * Validates billing manager, admin, or owner role
 */
export async function guardOrganizationBillingRoute(
  orgSlug: string,
  options: { redirectOnError?: boolean } = {}
): Promise<RouteGuardResult> {
  return guardOrganizationRoute(orgSlug, {
    minRole: 'billing_manager',
    redirectOnError: options.redirectOnError
  });
} 