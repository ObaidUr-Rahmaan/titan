'use client';

import { OrganizationSettings } from '@/components/organizations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { useOrganizationAdminGuard } from '@/utils/hooks/use-organization-guard';

export default function OrganizationSettingsPage() {
  const { isLoading, hasAccess, error } = useOrganizationAdminGuard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organization Settings</h1>
          <p className="text-muted-foreground">
            Manage your organization's settings and configuration.
          </p>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <CardTitle>Access Denied</CardTitle>
                <CardDescription>
                  You don't have permission to access organization settings
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {error || 'Organization settings require admin or owner role.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Organization Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization's settings and configuration.
        </p>
      </div>
      <OrganizationSettings />
    </div>
  );
} 