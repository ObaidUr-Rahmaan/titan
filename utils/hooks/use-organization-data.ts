'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '@clerk/nextjs';

// Types for organization data
interface OrganizationMember {
  id: string;
  userId: string;
  role: string;
  status: 'active' | 'pending' | 'inactive';
  joinedAt: Date;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    imageUrl?: string;
  };
}

interface OrganizationStats {
  totalMembers: number;
  activeProjects: number;
  pendingInvitations: number;
  recentActivity: number;
  lastUpdated: Date;
}

interface OrganizationSettings {
  name: string;
  description?: string;
  website?: string;
  logo?: string;
  theme: 'light' | 'dark' | 'system';
  visibility: 'public' | 'private';
  allowMemberInvites: boolean;
  requireAdminApproval: boolean;
}

interface OrganizationActivity {
  id: string;
  type: 'member_joined' | 'member_left' | 'project_created' | 'settings_updated' | 'billing_updated';
  description: string;
  timestamp: Date;
  userId?: string;
  metadata?: Record<string, any>;
}

// Query keys for consistent caching
export const organizationQueryKeys = {
  all: ['organization'] as const,
  organization: (orgId: string) => [...organizationQueryKeys.all, orgId] as const,
  members: (orgId: string) => [...organizationQueryKeys.organization(orgId), 'members'] as const,
  stats: (orgId: string) => [...organizationQueryKeys.organization(orgId), 'stats'] as const,
  settings: (orgId: string) => [...organizationQueryKeys.organization(orgId), 'settings'] as const,
  activity: (orgId: string) => [...organizationQueryKeys.organization(orgId), 'activity'] as const,
  permissions: (orgId: string, userId: string) => [
    ...organizationQueryKeys.organization(orgId), 
    'permissions', 
    userId
  ] as const,
};

/**
 * Hook for managing organization data with React Query
 * Provides caching, optimistic updates, and real-time synchronization
 */
export function useOrganizationData(organizationId?: string) {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  
  // Use provided organizationId or current organization
  const orgId = organizationId || organization?.id;
  
  // Fetch organization members
  const {
    data: members,
    isLoading: membersLoading,
    error: membersError,
    refetch: refetchMembers,
  } = useQuery({
    queryKey: organizationQueryKeys.members(orgId!),
    queryFn: async () => {
      // This would be replaced with actual API call
      // const response = await fetch(`/api/organizations/${orgId}/members`);
      // return response.json() as OrganizationMember[];
      return [] as OrganizationMember[];
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Fetch organization stats
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: organizationQueryKeys.stats(orgId!),
    queryFn: async () => {
      // This would be replaced with actual API call
      // const response = await fetch(`/api/organizations/${orgId}/stats`);
      // return response.json() as OrganizationStats;
      return {
        totalMembers: members?.length || 0,
        activeProjects: 0,
        pendingInvitations: 0,
        recentActivity: 0,
        lastUpdated: new Date(),
      } as OrganizationStats;
    },
    enabled: !!orgId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch organization settings
  const {
    data: settings,
    isLoading: settingsLoading,
    error: settingsError,
    refetch: refetchSettings,
  } = useQuery({
    queryKey: organizationQueryKeys.settings(orgId!),
    queryFn: async () => {
      // This would be replaced with actual API call
      // const response = await fetch(`/api/organizations/${orgId}/settings`);
      // return response.json() as OrganizationSettings;
      return {
        name: organization?.name || '',
        theme: 'system',
        visibility: 'private',
        allowMemberInvites: true,
        requireAdminApproval: false,
      } as OrganizationSettings;
    },
    enabled: !!orgId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch organization activity
  const {
    data: activity,
    isLoading: activityLoading,
    error: activityError,
    refetch: refetchActivity,
  } = useQuery({
    queryKey: organizationQueryKeys.activity(orgId!),
    queryFn: async () => {
      // This would be replaced with actual API call
      // const response = await fetch(`/api/organizations/${orgId}/activity`);
      // return response.json() as OrganizationActivity[];
      return [] as OrganizationActivity[];
    },
    enabled: !!orgId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Mutation for inviting members
  const inviteMemberMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      // This would be replaced with actual API call
      // const response = await fetch(`/api/organizations/${orgId}/members/invite`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, role }),
      // });
      // return response.json();
      return { success: true, email, role };
    },
    onMutate: async ({ email, role }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: organizationQueryKeys.members(orgId!) });
      
      // Snapshot the previous value
      const previousMembers = queryClient.getQueryData<OrganizationMember[]>(
        organizationQueryKeys.members(orgId!)
      );
      
      // Optimistically update
      const newMember: OrganizationMember = {
        id: `temp-${Date.now()}`,
        userId: `temp-user-${Date.now()}`,
        role,
        status: 'pending',
        joinedAt: new Date(),
        user: {
          id: `temp-user-${Date.now()}`,
          email,
        },
      };
      
      queryClient.setQueryData<OrganizationMember[]>(
        organizationQueryKeys.members(orgId!),
        (old) => old ? [...old, newMember] : [newMember]
      );
      
      return { previousMembers };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousMembers) {
        queryClient.setQueryData(
          organizationQueryKeys.members(orgId!),
          context.previousMembers
        );
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.members(orgId!) });
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.stats(orgId!) });
    },
  });

  // Mutation for removing members
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      // This would be replaced with actual API call
      // const response = await fetch(`/api/organizations/${orgId}/members/${memberId}`, {
      //   method: 'DELETE',
      // });
      // return response.json();
      return { success: true, memberId };
    },
    onMutate: async (memberId) => {
      await queryClient.cancelQueries({ queryKey: organizationQueryKeys.members(orgId!) });
      
      const previousMembers = queryClient.getQueryData<OrganizationMember[]>(
        organizationQueryKeys.members(orgId!)
      );
      
      queryClient.setQueryData<OrganizationMember[]>(
        organizationQueryKeys.members(orgId!),
        (old) => old?.filter(member => member.id !== memberId) || []
      );
      
      return { previousMembers };
    },
    onError: (err, variables, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(
          organizationQueryKeys.members(orgId!),
          context.previousMembers
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.members(orgId!) });
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.stats(orgId!) });
    },
  });

  // Mutation for updating organization settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<OrganizationSettings>) => {
      // This would be replaced with actual API call
      // const response = await fetch(`/api/organizations/${orgId}/settings`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(newSettings),
      // });
      // return response.json();
      return { success: true, settings: newSettings };
    },
    onMutate: async (newSettings) => {
      await queryClient.cancelQueries({ queryKey: organizationQueryKeys.settings(orgId!) });
      
      const previousSettings = queryClient.getQueryData<OrganizationSettings>(
        organizationQueryKeys.settings(orgId!)
      );
      
      queryClient.setQueryData<OrganizationSettings>(
        organizationQueryKeys.settings(orgId!),
        (old) => old ? { ...old, ...newSettings } : newSettings as OrganizationSettings
      );
      
      return { previousSettings };
    },
    onError: (err, variables, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(
          organizationQueryKeys.settings(orgId!),
          context.previousSettings
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.settings(orgId!) });
    },
  });

  // Refresh all organization data
  const refreshAll = async () => {
    if (!orgId) return;
    
    await Promise.all([
      refetchMembers(),
      refetchStats(),
      refetchSettings(),
      refetchActivity(),
    ]);
  };

  // Invalidate all organization data (force refetch)
  const invalidateAll = () => {
    if (!orgId) return;
    
    queryClient.invalidateQueries({ 
      queryKey: organizationQueryKeys.organization(orgId) 
    });
  };

  return {
    // Data
    members: members || [],
    stats: stats || {
      totalMembers: 0,
      activeProjects: 0,
      pendingInvitations: 0,
      recentActivity: 0,
      lastUpdated: new Date(),
    },
    settings: settings || null,
    activity: activity || [],
    
    // Loading states
    isLoading: membersLoading || statsLoading || settingsLoading || activityLoading,
    membersLoading,
    statsLoading,
    settingsLoading,
    activityLoading,
    
    // Errors
    error: membersError || statsError || settingsError || activityError,
    membersError,
    statsError,
    settingsError,
    activityError,
    
    // Mutations
    inviteMember: inviteMemberMutation.mutateAsync,
    isInviting: inviteMemberMutation.isPending,
    inviteError: inviteMemberMutation.error,
    
    removeMember: removeMemberMutation.mutateAsync,
    isRemoving: removeMemberMutation.isPending,
    removeError: removeMemberMutation.error,
    
    updateSettings: updateSettingsMutation.mutateAsync,
    isUpdatingSettings: updateSettingsMutation.isPending,
    updateError: updateSettingsMutation.error,
    
    // Refresh methods
    refreshMembers: refetchMembers,
    refreshStats: refetchStats,
    refreshSettings: refetchSettings,
    refreshActivity: refetchActivity,
    refreshAll,
    invalidateAll,
    
    // Utils
    getMember: (userId: string) => members?.find(m => m.userId === userId),
    getMemberCount: () => members?.length || 0,
    getPendingInvitations: () => members?.filter(m => m.status === 'pending') || [],
    getActiveMembers: () => members?.filter(m => m.status === 'active') || [],
  };
} 