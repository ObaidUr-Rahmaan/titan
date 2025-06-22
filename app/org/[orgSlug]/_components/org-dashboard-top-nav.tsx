'use client';

import { ReactNode } from 'react';
import { UserProfile } from '@/components/user-profile';
import config from '@/config';
import { OrganizationSwitcherEnhanced } from '@/components/organizations';
import { OrganizationWithMembership } from '@/utils/actions/organizations';
import Link from 'next/link';
import OrgDashboardSideBar from './org-dashboard-side-bar';

interface OrgDashboardTopNavProps {
  children: ReactNode;
  organization: OrganizationWithMembership;
}

export default function OrgDashboardTopNav({ children, organization }: OrgDashboardTopNavProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <OrgDashboardSideBar organization={organization} />
      
      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Navigation */}
        <header 
          className="flex items-center justify-between h-16 px-6 border-b"
          style={{
            backgroundColor: '#0f172a',
            borderColor: '#374151'
          }}
        >
          {/* Left side - Logo and organization info */}
          <div className="flex items-center gap-4">
            <Link 
              href={`/org/${organization.slug}/dashboard`} 
              className="flex items-center gap-2 font-semibold"
              style={{ color: '#f8fafc' }}
            >
              <span className="text-xl font-bold">Titan</span>
            </Link>
            
            {/* Organization context indicator */}
            <div className="hidden md:flex items-center gap-2 text-sm" style={{ color: '#9ca3af' }}>
              <span>/</span>
              <span className="font-medium">{organization.name}</span>
            </div>
          </div>
          
          {/* Right side - Organization switcher and user profile */}
          <div className="flex items-center gap-4">
            {config?.auth?.enabled && (
              <>
                <OrganizationSwitcherEnhanced />
                <UserProfile />
              </>
            )}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 