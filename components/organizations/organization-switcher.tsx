'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  OrganizationSwitcher, 
  ClerkLoading, 
  ClerkLoaded,
  useOrganization,
  useUser,
  useOrganizationList
} from '@clerk/nextjs';
import { useOrganizationState } from '@/utils/hooks/use-organization-state';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Building2, 
  Users, 
  Settings, 
  ChevronsUpDown,
  Crown,
  Shield,
  User,
  BarChart3,
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrganizationSwitcherEnhancedProps {
  className?: string;
  showQuickActions?: boolean;
  showRecentOrganizations?: boolean;
  maxRecentOrganizations?: number;
}

interface RecentOrganization {
  id: string;
  name: string;
  imageUrl?: string;
  slug: string;
  lastAccessed: Date;
}

export function OrganizationSwitcherEnhanced({
  className,
  showQuickActions = true,
  showRecentOrganizations = true,
  maxRecentOrganizations = 3
}: OrganizationSwitcherEnhancedProps) {
  const { organization, membership } = useOrganization();
  const { user } = useUser();
  const { setActive, userMemberships } = useOrganizationList();
  const router = useRouter();
  const pathname = usePathname();
  
  // Use global organization state management
  const {
    recentOrganizations,
    switchToOrganization,
    switchToPersonal,
    switchState,
    availableOrganizations,
    getEquivalentRoute,
  } = useOrganizationState();

  // Organization switching is now handled by global state management

  // Organization URL handling is now managed by global state

  // Handle organization switching with global state management
  const handleOrganizationSwitch = async (orgId: string) => {
    const result = await switchToOrganization(orgId);
    if (!result.success) {
      console.error('Error switching organization:', result.error);
    }
  };

  // Handle quick actions with global state management
  const handleQuickAction = (action: string) => {
    if (!organization?.slug) return;
    
    router.push(`/org/${organization.slug}/${action === 'dashboard' ? 'dashboard' : action}`);
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'org:admin':
        return <Crown className="w-3 h-3 text-amber-500" />;
      case 'org:member':
        return <User className="w-3 h-3 text-blue-500" />;
      default:
        return <Shield className="w-3 h-3 text-gray-500" />;
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'org:admin':
        return <Badge variant="secondary" className="text-xs">Admin</Badge>;
      case 'org:member':
        return <Badge variant="outline" className="text-xs">Member</Badge>;
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <Skeleton className="h-10 w-48" />
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Enhanced Organization Switcher */}
      <ClerkLoading>
        <Skeleton className="h-10 w-48" />
      </ClerkLoading>
      
      <ClerkLoaded>
        <div className="flex items-center gap-2">
          <OrganizationSwitcher
            appearance={{
              elements: {
                organizationSwitcherTrigger: cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50",
                  "text-sm font-medium transition-colors duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                ),
                organizationSwitcherTriggerIcon: "w-4 h-4",
                organizationPreview: "flex items-center gap-2",
                organizationPreviewAvatarBox: "w-6 h-6",
                organizationPreviewMainIdentifier: "font-medium text-sm",
                organizationPreviewSecondaryIdentifier: "text-xs text-gray-500",
                rootBox: "w-full",
                organizationSwitcherPopoverCard: "mt-2 w-80",
                organizationSwitcherPopoverMain: "p-4",
                organizationSwitcherPopoverFooter: "border-t p-4"
              },
              variables: {
                borderRadius: "0.5rem",
                colorPrimary: "#3b82f6"
              }
            }}
            createOrganizationMode="modal"
            afterCreateOrganizationUrl={(org: any) => `/org/${org.slug}/dashboard`}
            afterSelectOrganizationUrl={(org: any) => {
              const currentPath = window.location.pathname;
              // If we're on an org page, maintain the same sub-route structure
              if (currentPath.startsWith('/org/')) {
                const pathParts = currentPath.split('/');
                if (pathParts.length >= 4) {
                  return `/org/${org.slug}/${pathParts.slice(3).join('/')}`;
                }
              }
              return `/org/${org.slug}/dashboard`;
            }}
            organizationProfileMode="modal"
            hidePersonal={false}
          />

          {/* Current Organization Info */}
          {organization && membership && (
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-md">
              {getRoleIcon(membership.role)}
              {getRoleBadge(membership.role)}
            </div>
          )}
        </div>
      </ClerkLoaded>

      {/* Quick Actions Dropdown */}
      {showQuickActions && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-10 w-10 p-0">
              <ChevronsUpDown className="w-4 h-4" />
              <span className="sr-only">Quick organization actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Quick Actions
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* Create Organization */}
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => router.push('/dashboard')} // Let Clerk handle org creation
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Organization
              <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
            </DropdownMenuItem>

            {organization && (
              <>
                {/* Organization Dashboard */}
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => handleQuickAction('dashboard')}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Dashboard
                  <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
                </DropdownMenuItem>

                {/* Organization Settings */}
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => handleQuickAction('settings')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Organization Settings
                  <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                </DropdownMenuItem>

                {/* Invite Members */}
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => handleQuickAction('members')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Manage Members
                  <DropdownMenuShortcut>⌘M</DropdownMenuShortcut>
                </DropdownMenuItem>

                {/* Projects */}
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => handleQuickAction('projects')}
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Projects
                  <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
                </DropdownMenuItem>

                {/* Billing */}
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => handleQuickAction('billing')}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Billing & Plans
                  <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
                </DropdownMenuItem>
              </>
            )}

            {/* Recent Organizations */}
            {showRecentOrganizations && recentOrganizations.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Recent Organizations</DropdownMenuLabel>
                {recentOrganizations.map((org) => (
                  <DropdownMenuItem 
                    key={org.id} 
                    className="cursor-pointer"
                    onClick={() => handleOrganizationSwitch(org.id)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      {org.imageUrl ? (
                        <img 
                          src={org.imageUrl} 
                          alt={org.name}
                          className="w-4 h-4 rounded-full"
                        />
                      ) : (
                        <Building2 className="w-4 h-4" />
                      )}
                      <span className="flex-1 truncate">{org.name}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(org.lastAccessed).toLocaleDateString()}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export default OrganizationSwitcherEnhanced; 