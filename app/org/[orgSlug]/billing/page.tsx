'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, Banknote, AlertCircle } from 'lucide-react';
import { useOrganizationBillingGuard } from '@/utils/hooks/use-organization-guard';
import { OrganizationSubscriptionCard, OrganizationSeatManagement } from '@/components/organizations';

export default function OrganizationBillingPage() {
  const { isLoading, hasAccess, error } = useOrganizationBillingGuard({
    redirectOnError: false // Disable automatic redirect to prevent infinite loop
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <CardTitle>Access Denied</CardTitle>
                <CardDescription>
                  You don't have permission to access billing features
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {error || 'Billing management requires billing manager, admin, or owner role.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing & Subscription</h1>
          <p className="text-muted-foreground">
            Manage your organization's subscription and billing information.
          </p>
        </div>
      </div>

      {/* Organization Subscription Management */}
      <div className="grid gap-6 lg:grid-cols-2">
        <OrganizationSubscriptionCard />
        <OrganizationSeatManagement />
      </div>
    </div>
  );
} 