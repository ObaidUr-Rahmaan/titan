'use client';

import { UserProfile } from '@/components/user-profile';
import config from '@/config';
import { OrganizationSwitcherEnhanced } from '@/components/organizations';
import Link from 'next/link';
import { ReactNode } from 'react';

export default function DashboardTopNav({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col">
      <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b px-6">
        <div className="flex-1">
          <Link href="/" className="text-xl font-semibold">
            Titan
          </Link>
        </div>
        
        {/* Organization Switcher */}
        <div className="flex items-center gap-4">
          {config?.auth?.enabled && (
            <OrganizationSwitcherEnhanced />
          )}
          
          <UserProfile />
        </div>
      </header>
      {children}
    </div>
  );
}
