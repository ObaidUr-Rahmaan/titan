'use client';

import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import clsx from 'clsx';
import { 
  Banknote, 
  Folder, 
  HomeIcon, 
  Settings, 
  Users, 
  Building2,
  BarChart3,
  CreditCard,
  User
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useOrganization } from '@clerk/nextjs';

export default function DashboardSideBar() {
  const pathname = usePathname();
  const { organization } = useOrganization();

  // Determine if we're in organization context
  const isOrgContext = pathname.startsWith('/org/');
  const orgSlug = isOrgContext ? pathname.split('/')[2] : null;

  // Personal Dashboard Navigation
  const personalNavItems = [
    {
      label: 'Home',
      href: '/dashboard',
      icon: HomeIcon,
      active: pathname === '/dashboard'
    },
    {
      label: 'Projects',
      href: '/dashboard/projects',
      icon: Folder,
      active: pathname === '/dashboard/projects'
    },
    {
      label: 'Finance',
      href: '/dashboard/finance',
      icon: Banknote,
      active: pathname === '/dashboard/finance'
    }
  ];

  // Organization Dashboard Navigation
  const orgNavItems = orgSlug ? [
    {
      label: 'Dashboard',
      href: `/org/${orgSlug}/dashboard`,
      icon: BarChart3,
      active: pathname === `/org/${orgSlug}/dashboard`
    },
    {
      label: 'Members',
      href: `/org/${orgSlug}/members`,
      icon: Users,
      active: pathname === `/org/${orgSlug}/members`
    },
    {
      label: 'Projects',
      href: `/org/${orgSlug}/projects`,
      icon: Folder,
      active: pathname === `/org/${orgSlug}/projects`
    },
    {
      label: 'Billing',
      href: `/org/${orgSlug}/billing`,
      icon: CreditCard,
      active: pathname === `/org/${orgSlug}/billing`
    }
  ] : [];

  const navItems = isOrgContext ? orgNavItems : personalNavItems;
  const settingsHref = isOrgContext ? `/org/${orgSlug}/settings` : '/dashboard/settings';
  const settingsActive = isOrgContext 
    ? pathname === `/org/${orgSlug}/settings` 
    : pathname === '/dashboard/settings';

  return (
    <div className="lg:block hidden border-r h-full">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-[55px] items-center justify-between border-b px-3 w-full">
          <Link className="flex items-center gap-2 font-semibold ml-1" href="/">
            <span>Titan</span>
          </Link>
        </div>

        {/* Context Indicator */}
        <div className="px-4 py-2">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {isOrgContext ? (
              <>
                <Building2 className="w-3 h-3" />
                <span>Organization</span>
                <Badge variant="outline" className="text-xs">
                  {organization?.name || orgSlug}
                </Badge>
              </>
            ) : (
              <>
                <User className="w-3 h-3" />
                <span>Personal</span>
                <Badge variant="secondary" className="text-xs">
                  Individual
                </Badge>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                className={clsx(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50',
                  {
                    'flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-gray-900 transition-all hover:text-gray-900 dark:bg-gray-800 dark:text-gray-50 dark:hover:text-gray-50':
                      item.active,
                  }
                )}
                href={item.href}
              >
                <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                  <item.icon className="h-3 w-3" />
                </div>
                {item.label}
              </Link>
            ))}

            <Separator className="my-3" />

            {/* Settings Link */}
            <Link
              className={clsx(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50',
                {
                  'flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-gray-900 transition-all hover:text-gray-900 dark:bg-gray-800 dark:text-gray-50 dark:hover:text-gray-50':
                    settingsActive,
                }
              )}
              href={settingsHref}
              id="onboarding"
            >
              <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                <Settings className="h-3 w-3" />
              </div>
              Settings
            </Link>

            {/* Quick Switch */}
            {isOrgContext && (
              <>
                <Separator className="my-3" />
                <Link
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                  href="/dashboard"
                >
                  <div className="border rounded-lg dark:bg-black dark:border-gray-800 border-gray-400 p-1 bg-white">
                    <User className="h-3 w-3" />
                  </div>
                  Personal Dashboard
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}
