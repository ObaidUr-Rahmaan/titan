'use client';

import { useState, useEffect, useCallback } from 'react';
import { useOrganizationList, useOrganization, useUser } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';

// Types for organization state management
interface RecentOrganization {
  id: string;
  slug: string;
  name: string;
  imageUrl?: string;
  lastAccessed: Date;
  role?: string;
}

interface OrganizationSwitchState {
  isLoading: boolean;
  error?: string;
  lastSwitchedAt?: Date;
}

interface GlobalOrganizationState {
  // Current context
  currentOrgId?: string;
  currentOrgSlug?: string;
  isInOrgContext: boolean;
  
  // Recent organizations
  recentOrganizations: RecentOrganization[];
  
  // Switch state
  switchState: OrganizationSwitchState;
  
  // User preferences
  preferences: {
    defaultOrganization?: string;
    rememberLastOrganization: boolean;
    maxRecentOrganizations: number;
  };
}

const DEFAULT_STATE: GlobalOrganizationState = {
  isInOrgContext: false,
  recentOrganizations: [],
  switchState: {
    isLoading: false,
  },
  preferences: {
    rememberLastOrganization: true,
    maxRecentOrganizations: 5,
  },
};

/**
 * Global organization state management hook
 * Handles organization switching, recent organizations, and global state coordination
 */
export function useOrganizationState() {
  const { organization, membership } = useOrganization();
  const { setActive, userMemberships } = useOrganizationList();
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  
  const [state, setState] = useState<GlobalOrganizationState>(DEFAULT_STATE);

  // Determine current organization context from URL
  const isInOrgContext = pathname.startsWith('/org/');
  const currentOrgSlug = isInOrgContext ? pathname.split('/')[2] : undefined;
  const currentOrgId = organization?.id;

  // Load state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedState = localStorage.getItem('global_organization_state');
        if (savedState) {
          const parsed = JSON.parse(savedState);
          setState(prev => ({
            ...prev,
            recentOrganizations: parsed.recentOrganizations || [],
            preferences: { ...prev.preferences, ...parsed.preferences },
          }));
        }
      } catch (error) {
        console.error('Error loading organization state:', error);
      }
    }
  }, []);

  // Update current context
  useEffect(() => {
    setState(prev => ({
      ...prev,
      currentOrgId,
      currentOrgSlug,
      isInOrgContext,
    }));
  }, [currentOrgId, currentOrgSlug, isInOrgContext]);

  // Track organization access
  useEffect(() => {
    if (organization && isInOrgContext) {
      addToRecentOrganizations({
        id: organization.id,
        slug: organization.slug || '',
        name: organization.name,
        imageUrl: organization.imageUrl,
        lastAccessed: new Date(),
        role: membership?.role,
      });
    }
  }, [organization, isInOrgContext, membership]);

  // Save state to localStorage
  const saveState = useCallback((newState: Partial<GlobalOrganizationState>) => {
    if (typeof window !== 'undefined') {
      try {
        const stateToSave = {
          recentOrganizations: newState.recentOrganizations || state.recentOrganizations,
          preferences: newState.preferences || state.preferences,
        };
        localStorage.setItem('global_organization_state', JSON.stringify(stateToSave));
      } catch (error) {
        console.error('Error saving organization state:', error);
      }
    }
  }, [state]);

  // Add organization to recent list
  const addToRecentOrganizations = useCallback((org: RecentOrganization) => {
    setState(prev => {
      const filtered = prev.recentOrganizations.filter(r => r.id !== org.id);
      const updated = [org, ...filtered].slice(0, prev.preferences.maxRecentOrganizations);
      
      const newState = { ...prev, recentOrganizations: updated };
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  // Switch to organization
  const switchToOrganization = useCallback(async (orgId: string, targetRoute?: string) => {
    if (!setActive || !userMemberships?.data) {
      return { success: false, error: 'Organization switching not available' };
    }

    setState(prev => ({
      ...prev,
      switchState: { isLoading: true, error: undefined }
    }));

    try {
      const targetMembership = userMemberships.data.find(
        membership => membership.organization.id === orgId
      );

      if (!targetMembership) {
        throw new Error('Organization not found or access denied');
      }

      await setActive({ organization: targetMembership.organization });

      // Determine target URL
      const orgSlug = targetMembership.organization.slug;
      let targetUrl = `/org/${orgSlug}/dashboard`;

      if (targetRoute) {
        targetUrl = `/org/${orgSlug}/${targetRoute}`;
      } else if (isInOrgContext) {
        // Maintain current sub-route when switching organizations
        const pathParts = pathname.split('/');
        if (pathParts.length >= 4) {
          targetUrl = `/org/${orgSlug}/${pathParts.slice(3).join('/')}`;
        }
      }

      router.push(targetUrl);

      setState(prev => ({
        ...prev,
        switchState: { isLoading: false, lastSwitchedAt: new Date() }
      }));

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to switch organization';
      
      setState(prev => ({
        ...prev,
        switchState: { isLoading: false, error: errorMessage }
      }));

      return { success: false, error: errorMessage };
    }
  }, [setActive, userMemberships, router, pathname, isInOrgContext]);

  // Switch to personal dashboard
  const switchToPersonal = useCallback((targetRoute?: string) => {
    let targetUrl = '/dashboard';

    if (targetRoute) {
      targetUrl = `/dashboard/${targetRoute}`;
    } else if (isInOrgContext) {
      // Map organization routes to personal equivalents
      const routeMap: Record<string, string> = {
        'dashboard': '/dashboard',
        'projects': '/dashboard/projects',
        'billing': '/dashboard/finance',
        'settings': '/dashboard/settings',
      };

      const currentRoute = pathname.split('/')[3];
      targetUrl = routeMap[currentRoute] || '/dashboard';
    }

    router.push(targetUrl);
  }, [router, pathname, isInOrgContext]);

  // Get organization by slug
  const getOrganizationBySlug = useCallback((slug: string) => {
    return userMemberships?.data?.find(
      membership => membership.organization.slug === slug
    )?.organization;
  }, [userMemberships]);

  // Update preferences
  const updatePreferences = useCallback((newPreferences: Partial<typeof state.preferences>) => {
    setState(prev => {
      const updatedState = {
        ...prev,
        preferences: { ...prev.preferences, ...newPreferences }
      };
      saveState(updatedState);
      return updatedState;
    });
  }, [saveState]);

  // Clear recent organizations
  const clearRecentOrganizations = useCallback(() => {
    setState(prev => {
      const updatedState = { ...prev, recentOrganizations: [] };
      saveState(updatedState);
      return updatedState;
    });
  }, [saveState]);

  // Get available organizations for switching
  const availableOrganizations = userMemberships?.data?.map(membership => ({
    id: membership.organization.id,
    slug: membership.organization.slug || '',
    name: membership.organization.name,
    imageUrl: membership.organization.imageUrl,
    role: membership.role,
    isCurrent: membership.organization.id === currentOrgId,
  })) || [];

  return {
    // State
    ...state,
    availableOrganizations,
    
    // Current context helpers
    isCurrentOrganization: (orgId: string) => orgId === currentOrgId,
    getCurrentRoute: () => isInOrgContext ? pathname.split('/').slice(3).join('/') : pathname.split('/').slice(2).join('/'),
    
    // Organization management
    switchToOrganization,
    switchToPersonal,
    getOrganizationBySlug,
    
    // Recent organizations
    addToRecentOrganizations,
    clearRecentOrganizations,
    
    // Preferences
    updatePreferences,
    
    // Utils
    canSwitchToOrganization: (orgId: string) => {
      return userMemberships?.data?.some(m => m.organization.id === orgId) || false;
    },
    
    getEquivalentRoute: (fromContext: 'personal' | 'org', toOrgSlug?: string) => {
      const currentRoute = pathname.split('/').slice(isInOrgContext ? 3 : 2).join('/');
      
      if (fromContext === 'personal' && toOrgSlug) {
        // Personal to org
        const routeMap: Record<string, string> = {
          '': 'dashboard',
          'projects': 'projects',
          'finance': 'billing',
          'settings': 'settings',
        };
        const targetRoute = routeMap[currentRoute] || 'dashboard';
        return `/org/${toOrgSlug}/${targetRoute}`;
      } else if (fromContext === 'org') {
        // Org to personal
        const routeMap: Record<string, string> = {
          'dashboard': '/dashboard',
          'projects': '/dashboard/projects',
          'billing': '/dashboard/finance',
          'settings': '/dashboard/settings',
        };
        return routeMap[currentRoute] || '/dashboard';
      }
      
      return '/dashboard';
    },
  };
} 