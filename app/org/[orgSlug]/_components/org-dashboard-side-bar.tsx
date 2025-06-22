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
    <div 
      className="lg:block hidden border-r h-full w-64" 
      style={{ 
        backgroundColor: '#0f172a', 
        borderColor: '#374151',
        color: '#f8fafc'
      }}
    >
      <div className="flex h-full max-h-screen flex-col gap-2">
        {/* Organization header */}
        <div 
          className="flex h-[60px] items-center justify-between border-b px-4 w-full"
          style={{ 
            borderColor: '#374151',
            backgroundColor: '#0f172a'
          }}
        >
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-900 rounded-lg">
              <Building2 className="h-4 w-4 text-blue-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm truncate max-w-[140px]" style={{ color: '#f8fafc' }}>{organization.name}</span>
              <span className="text-xs capitalize" style={{ color: '#9ca3af' }}>{organization.membership?.role}</span>
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
                  className="flex items-center gap-3 rounded-lg px-3 py-2 transition-all"
                  style={{
                    color: isActive ? '#f8fafc' : '#9ca3af',
                    backgroundColor: isActive ? '#374151' : 'transparent'
                  }}
                  href={item.href}
                >
                  <div 
                    className="border rounded-lg p-1"
                    style={{
                      backgroundColor: '#1f2937',
                      borderColor: '#374151'
                    }}
                  >
                    <Icon className="h-3 w-3" />
                  </div>
                  <div className="flex flex-col">
                    <span>{item.label}</span>
                    <span className="text-xs" style={{ color: '#6b7280' }}>{item.description}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          <Separator className="my-3 mx-4" style={{ backgroundColor: '#374151' }} />

          {/* Settings section */}
          <nav className="grid items-start px-4 text-sm font-medium">
            {settingsItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 transition-all"
                  style={{
                    color: isActive ? '#f8fafc' : '#9ca3af',
                    backgroundColor: isActive ? '#374151' : 'transparent'
                  }}
                  href={item.href}
                >
                  <div 
                    className="border rounded-lg p-1"
                    style={{
                      backgroundColor: '#1f2937',
                      borderColor: '#374151'
                    }}
                  >
                    <Icon className="h-3 w-3" />
                  </div>
                  <div className="flex flex-col">
                    <span>{item.label}</span>
                    <span className="text-xs" style={{ color: '#6b7280' }}>{item.description}</span>
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