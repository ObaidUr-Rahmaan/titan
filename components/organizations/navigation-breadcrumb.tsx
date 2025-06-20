'use client';

import { usePathname } from 'next/navigation';
import { useOrganization } from '@clerk/nextjs';
import Link from 'next/link';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  User, 
  ArrowLeft, 
  Home,
  Users,
  Settings,
  CreditCard,
  Folder,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationBreadcrumbProps {
  className?: string;
}

export function NavigationBreadcrumb({ className }: NavigationBreadcrumbProps) {
  const pathname = usePathname();
  const { organization } = useOrganization();

  // Determine if we're in organization context
  const isOrgContext = pathname.startsWith('/org/');
  const pathParts = pathname.split('/').filter(Boolean);

  // Skip rendering on homepage
  if (pathname === '/') return null;

  // Parse organization route
  let orgSlug: string | null = null;
  let orgRoute: string | null = null;
  
  if (isOrgContext && pathParts.length >= 2) {
    orgSlug = pathParts[1];
    orgRoute = pathParts[2] || 'dashboard';
  }

  // Parse personal dashboard route
  let personalRoute: string | null = null;
  if (pathname.startsWith('/dashboard')) {
    personalRoute = pathParts[1] || 'home';
  }

  // Route name mapping
  const getRouteDisplayName = (route: string) => {
    const routeMap: Record<string, { label: string; icon: any }> = {
      'dashboard': { label: 'Dashboard', icon: BarChart3 },
      'home': { label: 'Home', icon: Home },
      'members': { label: 'Members', icon: Users },
      'settings': { label: 'Settings', icon: Settings },
      'billing': { label: 'Billing', icon: CreditCard },
      'projects': { label: 'Projects', icon: Folder },
      'finance': { label: 'Finance', icon: CreditCard }
    };
    return routeMap[route] || { label: route.charAt(0).toUpperCase() + route.slice(1), icon: Home };
  };

  // Context switching links
  const getContextSwitchLink = () => {
    if (isOrgContext) {
      // Switch to personal dashboard equivalent
      const personalRouteMap: Record<string, string> = {
        'dashboard': '/dashboard',
        'projects': '/dashboard/projects',
        'billing': '/dashboard/finance',
        'settings': '/dashboard/settings'
      };
      return personalRouteMap[orgRoute || 'dashboard'] || '/dashboard';
    } else {
      // If in personal context and have an organization, suggest switching
      if (organization?.slug) {
        const orgRouteMap: Record<string, string> = {
          'home': 'dashboard',
          'projects': 'projects',
          'finance': 'billing',
          'settings': 'settings'
        };
        const targetRoute = orgRouteMap[personalRoute || 'home'] || 'dashboard';
        return `/org/${organization.slug}/${targetRoute}`;
      }
      return null;
    }
  };

  const contextSwitchLink = getContextSwitchLink();

  return (
    <div className={cn("flex items-center justify-between py-2 px-6 bg-gray-50/50 border-b", className)}>
      <div className="flex items-center gap-4">
        {/* Context Indicator */}
        <div className="flex items-center gap-2">
          {isOrgContext ? (
            <>
              <Building2 className="w-4 h-4 text-gray-600" />
              <Badge variant="outline" className="text-xs">
                Organization
              </Badge>
            </>
          ) : (
            <>
              <User className="w-4 h-4 text-gray-600" />
              <Badge variant="secondary" className="text-xs">
                Personal
              </Badge>
            </>
          )}
        </div>

        {/* Breadcrumb Navigation */}
        <Breadcrumb>
          <BreadcrumbList>
            {isOrgContext ? (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/dashboard" className="flex items-center gap-1">
                      <Home className="w-3 h-3" />
                      Dashboard
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={`/org/${orgSlug}/dashboard`} className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {organization?.name || orgSlug}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {orgRoute && orgRoute !== 'dashboard' && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="flex items-center gap-1">
                        {(() => {
                          const { label, icon: Icon } = getRouteDisplayName(orgRoute);
                          return (
                            <>
                              <Icon className="w-3 h-3" />
                              {label}
                            </>
                          );
                        })()}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </>
            ) : (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/" className="flex items-center gap-1">
                      <Home className="w-3 h-3" />
                      Home
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {pathname !== '/dashboard' && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link href="/dashboard" className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Dashboard
                        </Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  </>
                )}
                {personalRoute && personalRoute !== 'home' && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="flex items-center gap-1">
                        {(() => {
                          const { label, icon: Icon } = getRouteDisplayName(personalRoute);
                          return (
                            <>
                              <Icon className="w-3 h-3" />
                              {label}
                            </>
                          );
                        })()}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Context Switch Action */}
      {contextSwitchLink && (
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            asChild
            className="text-xs"
          >
            <Link href={contextSwitchLink} className="flex items-center gap-2">
              <ArrowLeft className="w-3 h-3" />
              {isOrgContext ? (
                <>
                  <User className="w-3 h-3" />
                  Switch to Personal
                </>
              ) : (
                <>
                  <Building2 className="w-3 h-3" />
                  Switch to {organization?.name}
                </>
              )}
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
} 