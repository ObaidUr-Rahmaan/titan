'use client';

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useOrganization, useUser } from '@clerk/nextjs';

// Organization State Types
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

interface OrganizationPermissions {
  canManageMembers: boolean;
  canManageBilling: boolean;
  canManageSettings: boolean;
  canViewAnalytics: boolean;
  canManageProjects: boolean;
  canCreateProjects: boolean;
  canDeleteOrganization: boolean;
}

interface OrganizationPreferences {
  defaultView: 'dashboard' | 'projects' | 'members';
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    desktop: boolean;
    memberJoined: boolean;
    billingUpdates: boolean;
    projectUpdates: boolean;
  };
  sidebar: {
    collapsed: boolean;
    pinnedItems: string[];
  };
}

interface OrganizationStats {
  totalMembers: number;
  activeProjects: number;
  pendingInvitations: number;
  recentActivity: number;
  lastUpdated: Date;
}

interface OrganizationState {
  // Basic Info
  organizationId: string;
  organizationSlug: string;
  organizationName?: string;
  organizationImageUrl?: string;
  
  // Member Data
  currentMember?: OrganizationMember;
  members: OrganizationMember[];
  membersLoading: boolean;
  
  // Permissions
  permissions: OrganizationPermissions;
  
  // Preferences
  preferences: OrganizationPreferences;
  
  // Stats
  stats: OrganizationStats;
  
  // UI State
  isLoading: boolean;
  error?: string;
}

// Action Types
type OrganizationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_ORGANIZATION_DATA'; payload: Partial<OrganizationState> }
  | { type: 'SET_MEMBERS'; payload: OrganizationMember[] }
  | { type: 'SET_MEMBERS_LOADING'; payload: boolean }
  | { type: 'UPDATE_PERMISSIONS'; payload: Partial<OrganizationPermissions> }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<OrganizationPreferences> }
  | { type: 'UPDATE_STATS'; payload: Partial<OrganizationStats> }
  | { type: 'ADD_MEMBER'; payload: OrganizationMember }
  | { type: 'REMOVE_MEMBER'; payload: string }
  | { type: 'UPDATE_MEMBER'; payload: { id: string; updates: Partial<OrganizationMember> } };

// Initial State
const createInitialState = (organizationId: string, organizationSlug: string): OrganizationState => ({
  organizationId,
  organizationSlug,
  members: [],
  membersLoading: false,
  permissions: {
    canManageMembers: false,
    canManageBilling: false,
    canManageSettings: false,
    canViewAnalytics: false,
    canManageProjects: false,
    canCreateProjects: false,
    canDeleteOrganization: false,
  },
  preferences: {
    defaultView: 'dashboard',
    theme: 'system',
    notifications: {
      email: true,
      desktop: true,
      memberJoined: true,
      billingUpdates: true,
      projectUpdates: true,
    },
    sidebar: {
      collapsed: false,
      pinnedItems: [],
    },
  },
  stats: {
    totalMembers: 0,
    activeProjects: 0,
    pendingInvitations: 0,
    recentActivity: 0,
    lastUpdated: new Date(),
  },
  isLoading: true,
});

// Reducer
function organizationReducer(state: OrganizationState, action: OrganizationAction): OrganizationState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_ORGANIZATION_DATA':
      return { ...state, ...action.payload, isLoading: false };
    
    case 'SET_MEMBERS':
      return { 
        ...state, 
        members: action.payload,
        stats: { ...state.stats, totalMembers: action.payload.length }
      };
    
    case 'SET_MEMBERS_LOADING':
      return { ...state, membersLoading: action.payload };
    
    case 'UPDATE_PERMISSIONS':
      return { 
        ...state, 
        permissions: { ...state.permissions, ...action.payload }
      };
    
    case 'UPDATE_PREFERENCES':
      return { 
        ...state, 
        preferences: { ...state.preferences, ...action.payload }
      };
    
    case 'UPDATE_STATS':
      return { 
        ...state, 
        stats: { ...state.stats, ...action.payload, lastUpdated: new Date() }
      };
    
    case 'ADD_MEMBER':
      return {
        ...state,
        members: [...state.members, action.payload],
        stats: { ...state.stats, totalMembers: state.stats.totalMembers + 1 }
      };
    
    case 'REMOVE_MEMBER':
      return {
        ...state,
        members: state.members.filter(member => member.id !== action.payload),
        stats: { ...state.stats, totalMembers: state.stats.totalMembers - 1 }
      };
    
    case 'UPDATE_MEMBER':
      return {
        ...state,
        members: state.members.map(member =>
          member.id === action.payload.id
            ? { ...member, ...action.payload.updates }
            : member
        ),
      };
    
    default:
      return state;
  }
}

// Context
interface OrganizationContextType {
  state: OrganizationState;
  dispatch: React.Dispatch<OrganizationAction>;
  
  // Helper functions
  updatePreferences: (preferences: Partial<OrganizationPreferences>) => void;
  refreshMembers: () => Promise<void>;
  refreshStats: () => Promise<void>;
  hasPermission: (permission: keyof OrganizationPermissions) => boolean;
  isOwner: () => boolean;
  isAdmin: () => boolean;
  canManage: (resource: string) => boolean;
}

const OrganizationContext = createContext<OrganizationContextType | null>(null);

interface OrganizationProviderProps {
  children: ReactNode;
  organizationId: string;
  organizationSlug: string;
}

export function OrganizationProvider({ 
  children, 
  organizationId, 
  organizationSlug 
}: OrganizationProviderProps) {
  const { organization, membership } = useOrganization();
  const { user } = useUser();
  
  const [state, dispatch] = useReducer(
    organizationReducer,
    createInitialState(organizationId, organizationSlug)
  );

  // Calculate permissions based on membership role
  const calculatePermissions = (role?: string): OrganizationPermissions => {
    const rolePermissions: Record<string, OrganizationPermissions> = {
      'org:admin': {
        canManageMembers: true,
        canManageBilling: true,
        canManageSettings: true,
        canViewAnalytics: true,
        canManageProjects: true,
        canCreateProjects: true,
        canDeleteOrganization: true,
      },
      'org:member': {
        canManageMembers: false,
        canManageBilling: false,
        canManageSettings: false,
        canViewAnalytics: true,
        canManageProjects: false,
        canCreateProjects: true,
        canDeleteOrganization: false,
      },
    };

    return rolePermissions[role || 'org:member'] || rolePermissions['org:member'];
  };

  // Load organization data
  useEffect(() => {
    if (organization && membership && user) {
      const permissions = calculatePermissions(membership.role);
      
      dispatch({
        type: 'SET_ORGANIZATION_DATA',
        payload: {
          organizationName: organization.name,
          organizationImageUrl: organization.imageUrl,
          permissions,
          currentMember: {
            id: membership.id,
            userId: user.id,
            role: membership.role,
            status: 'active',
            joinedAt: new Date(membership.createdAt),
            user: {
              id: user.id,
              firstName: user.firstName || undefined,
              lastName: user.lastName || undefined,
              email: user.primaryEmailAddress?.emailAddress || '',
              imageUrl: user.imageUrl,
            },
          },
        },
      });
    }
  }, [organization, membership, user]);

  // Load preferences from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPreferences = localStorage.getItem(`org_preferences_${organizationId}`);
      if (savedPreferences) {
        try {
          const preferences = JSON.parse(savedPreferences);
          dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
        } catch (error) {
          console.error('Error loading organization preferences:', error);
        }
      }
    }
  }, [organizationId]);

  // Helper functions
  const updatePreferences = (newPreferences: Partial<OrganizationPreferences>) => {
    const updatedPreferences = { ...state.preferences, ...newPreferences };
    dispatch({ type: 'UPDATE_PREFERENCES', payload: newPreferences });
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        `org_preferences_${organizationId}`,
        JSON.stringify(updatedPreferences)
      );
    }
  };

  const refreshMembers = async () => {
    dispatch({ type: 'SET_MEMBERS_LOADING', payload: true });
    try {
      // This would be replaced with actual API call to fetch members
      // For now, we'll use mock data or Clerk's organization members
      // const members = await fetchOrganizationMembers(organizationId);
      // dispatch({ type: 'SET_MEMBERS', payload: members });
    } catch (error) {
      console.error('Error refreshing members:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh members' });
    } finally {
      dispatch({ type: 'SET_MEMBERS_LOADING', payload: false });
    }
  };

  const refreshStats = async () => {
    try {
      // This would be replaced with actual API call to fetch organization stats
      // const stats = await fetchOrganizationStats(organizationId);
      // dispatch({ type: 'UPDATE_STATS', payload: stats });
    } catch (error) {
      console.error('Error refreshing stats:', error);
    }
  };

  const hasPermission = (permission: keyof OrganizationPermissions): boolean => {
    return state.permissions[permission];
  };

  const isOwner = (): boolean => {
    return membership?.role === 'org:admin';
  };

  const isAdmin = (): boolean => {
    return membership?.role === 'org:admin';
  };

  const canManage = (resource: string): boolean => {
    const resourcePermissions: Record<string, keyof OrganizationPermissions> = {
      'members': 'canManageMembers',
      'billing': 'canManageBilling',
      'settings': 'canManageSettings',
      'projects': 'canManageProjects',
    };
    
    const permission = resourcePermissions[resource];
    return permission ? hasPermission(permission) : false;
  };

  const contextValue: OrganizationContextType = {
    state,
    dispatch,
    updatePreferences,
    refreshMembers,
    refreshStats,
    hasPermission,
    isOwner,
    isAdmin,
    canManage,
  };

  return (
    <OrganizationContext.Provider value={contextValue}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganizationContext() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganizationContext must be used within an OrganizationProvider');
  }
  return context;
} 