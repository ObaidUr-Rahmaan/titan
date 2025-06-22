'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useOrganization, useUser } from '@clerk/nextjs';
import { extractOrgSlugFromPath, isOrganizationPath } from '@/utils/auth/route-guards';

export interface UseOrganizationGuardResult {
  isLoading: boolean;
  hasAccess: boolean;
  error: string | null;
  organizationSlug: string | null;
  userRole: string | null;
  isAdmin: boolean;
  isBillingManager: boolean;
  redirectToFallback: () => void;
}

interface UseOrganizationGuardOptions {
  minRole?: 'viewer' | 'developer' | 'project_manager' | 'billing_manager' | 'admin' | 'owner';
  requiredPermissions?: string[];
  fallbackUrl?: string;
  redirectOnError?: boolean;
}

/**
 * Client-side hook for organization access control
 * Validates organization membership and role requirements
 */
export function useOrganizationGuard(options: UseOrganizationGuardOptions = {}): UseOrganizationGuardResult {
  const {
    minRole,
    requiredPermissions = [],
    fallbackUrl = '/dashboard',
    redirectOnError = true
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { organization, membership, isLoaded: orgLoaded } = useOrganization();
  const { isLoaded: userLoaded, isSignedIn } = useUser();

  const [state, setState] = useState<{
    isLoading: boolean;
    hasAccess: boolean;
    error: string | null;
  }>({
    isLoading: true,
    hasAccess: false,
    error: null
  });

  // Role hierarchy for comparison
  const roleHierarchy = {
    'viewer': 1,
    'developer': 2,
    'project_manager': 3,
    'billing_manager': 4,
    'admin': 5,
    'owner': 6
  };

  const organizationSlug = extractOrgSlugFromPath(pathname);
  const isOrgRoute = isOrganizationPath(pathname);
  
  // Check if we're already on an error page to prevent infinite redirects
  const errorParam = searchParams.get('error');
  const isOnErrorPage = errorParam === 'insufficient-permissions' || 
                       errorParam === 'organization-not-found' ||
                       errorParam === 'organization-mismatch';

  useEffect(() => {
    async function validateAccess() {
      // Wait for Clerk to load
      if (!orgLoaded || !userLoaded) {
        setState(prev => ({ ...prev, isLoading: true }));
        return;
      }

      // Check if user is signed in
      if (!isSignedIn) {
        setState({
          isLoading: false,
          hasAccess: false,
          error: 'User not authenticated'
        });
        
        if (redirectOnError && !isOnErrorPage) {
          router.push('/sign-in');
        }
        return;
      }

      // If not an organization route, allow access
      if (!isOrgRoute) {
        setState({
          isLoading: false,
          hasAccess: true,
          error: null
        });
        return;
      }

      // If organization route but no organization context, deny access
      if (!organization || !membership) {
        setState({
          isLoading: false,
          hasAccess: false,
          error: 'Organization not found or access denied'
        });
        
        if (redirectOnError && !isOnErrorPage) {
          router.push(`${fallbackUrl}?error=organization-not-found`);
        }
        return;
      }

      // Check if organization slug matches current organization
      if (organizationSlug && organization.slug !== organizationSlug) {
        setState({
          isLoading: false,
          hasAccess: false,
          error: 'Organization slug mismatch'
        });
        
        if (redirectOnError && !isOnErrorPage) {
          router.push(`${fallbackUrl}?error=organization-mismatch`);
        }
        return;
      }

      // Check minimum role requirement
      if (minRole) {
        const userRoleLevel = roleHierarchy[membership.role as keyof typeof roleHierarchy] || 0;
        const minRoleLevel = roleHierarchy[minRole] || 0;
        
        if (userRoleLevel < minRoleLevel) {
          setState({
            isLoading: false,
            hasAccess: false,
            error: `Minimum role required: ${minRole}`
          });
          
          // Only redirect if not already on an error page to prevent infinite loops
          if (redirectOnError && !isOnErrorPage) {
            router.push(`/org/${organizationSlug}/dashboard?error=insufficient-permissions`);
          }
          return;
        }
      }

      // Check required permissions
      if (requiredPermissions.length > 0) {
        const userPermissions = membership.permissions || [];
        const missingPermissions = requiredPermissions.filter(
          permission => !userPermissions.includes(permission)
        );
        
        if (missingPermissions.length > 0) {
          setState({
            isLoading: false,
            hasAccess: false,
            error: `Missing permissions: ${missingPermissions.join(', ')}`
          });
          
          if (redirectOnError && !isOnErrorPage) {
            router.push(`/org/${organizationSlug}/dashboard?error=insufficient-permissions`);
          }
          return;
        }
      }

      // All checks passed
      setState({
        isLoading: false,
        hasAccess: true,
        error: null
      });
    }

    validateAccess();
  }, [
    orgLoaded,
    userLoaded,
    isSignedIn,
    organization,
    membership,
    organizationSlug,
    isOrgRoute,
    minRole,
    requiredPermissions?.join(','), // Stabilize array dependency
    redirectOnError,
    fallbackUrl,
    isOnErrorPage, // This is now stable
    router
  ]);

  // Helper function to manually redirect to fallback
  const redirectToFallback = () => {
    router.push(fallbackUrl);
  };

  return {
    isLoading: state.isLoading,
    hasAccess: state.hasAccess,
    error: state.error,
    organizationSlug,
    userRole: membership?.role || null,
    isAdmin: membership ? roleHierarchy[membership.role as keyof typeof roleHierarchy] >= roleHierarchy.admin : false,
    isBillingManager: membership ? roleHierarchy[membership.role as keyof typeof roleHierarchy] >= roleHierarchy.billing_manager : false,
    redirectToFallback
  };
}

/**
 * Simplified hook for admin-only routes
 */
export function useOrganizationAdminGuard(options: Omit<UseOrganizationGuardOptions, 'minRole'> = {}) {
  return useOrganizationGuard({
    ...options,
    minRole: 'admin'
  });
}

/**
 * Simplified hook for billing routes
 */
export function useOrganizationBillingGuard(options: Omit<UseOrganizationGuardOptions, 'minRole'> = {}) {
  return useOrganizationGuard({
    ...options,
    minRole: 'billing_manager'
  });
} 