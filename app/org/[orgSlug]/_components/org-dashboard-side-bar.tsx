'use client';

import { Separator } from '@/components/ui/separator';
import clsx from 'clsx';
import { Banknote, Users, HomeIcon, Settings, Building2, FolderOpen } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { OrganizationWithMembership } from '@/utils/actions/organizations';

interface OrgDashboardSideBarProps {
  organization: OrganizationWithMembership;
}

export default function OrgDashboardSideBar({ organization }: OrgDashboardSideBarProps) {
  const pathname = usePathname();
  const baseUrl = `/org/${organization.slug}`;

  const navigationItems = [
    {
      href: `${baseUrl}/dashboard`,
      icon: HomeIcon,
      label: 'Dashboard',
      description: 'Organization overview'
    },
    {
      href: `${baseUrl}/projects`,
      icon: FolderOpen,
      label: 'Projects',
      description: 'Manage projects'
    },
    {
      href: `${baseUrl}/members`,
      icon: Users,
      label: 'Members',
      description: 'Team management'
    },
    {
      href: `${baseUrl}/billing`,
      icon: Banknote,
      label: 'Billing',
      description: 'Subscription & invoices'
    },
  ];

  const settingsItems = [
    {
      href: `${baseUrl}/settings`,
      icon: Settings,
      label: 'Settings',
      description: 'Organization settings'
    }
  ];

  return (
    <div className="lg:block hidden border-r h-full w-64 bg-white dark:bg-gray-900">
      <div className="flex h-full max-h-screen flex-col gap-2">
        {/* Organization header */}
        <div className="flex h-[60px] items-center justify-between border-b px-4 w-full">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm truncate max-w-[140px]">{organization.name}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{organization.membership?.role}</span>
            </div>
          </div>
        </div>

        {/* Main navigation */}
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  className={clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50',
                    {
                      'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50': isActive,
                    }
                  )}
                  href={item.href}
                >
                  <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                    <Icon className="h-3 w-3" />
                  </div>
                  <div className="flex flex-col">
                    <span>{item.label}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{item.description}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          <Separator className="my-3 mx-4" />

          {/* Settings section */}
          <nav className="grid items-start px-4 text-sm font-medium">
            {settingsItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  className={clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50',
                    {
                      'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50': isActive,
                    }
                  )}
                  href={item.href}
                >
                  <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                    <Icon className="h-3 w-3" />
                  </div>
                  <div className="flex flex-col">
                    <span>{item.label}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{item.description}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
} 