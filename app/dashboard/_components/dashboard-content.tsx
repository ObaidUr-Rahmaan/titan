'use client';

import { useOrganization } from '@clerk/nextjs';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowUpRight, LineChart, Users, Activity, Layers } from 'lucide-react';
import Link from 'next/link';
import { BarChartBetter } from './bar-chart-better';
import { TestPaymentButton } from './test-payment-button';
import { OrganizationDashboard } from '@/components/organizations';
import { OrganizationCreationForm } from '@/components/organizations/organization-creation-form';

export default function DashboardContent() {
  const { organization, isLoaded } = useOrganization();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showCreateOrg, setShowCreateOrg] = useState(false);

  // Check for create-org parameter
  useEffect(() => {
    if (searchParams.get('create-org') === 'true') {
      setShowCreateOrg(true);
    }
  }, [searchParams]);

  // Handle closing the modal
  const handleCloseModal = () => {
    setShowCreateOrg(false);
    // Remove the create-org parameter from URL
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('create-org');
    router.replace(newUrl.pathname + newUrl.search);
  };

  // Handle successful organization creation
  const handleOrgCreated = (organizationId: number) => {
    setShowCreateOrg(false);
    // The organization creation form should handle the redirect
  };

  // Show loading state while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // If user is in an organization context, show organization dashboard
  if (organization) {
    return <OrganizationDashboard />;
  }

  // Otherwise, show personal dashboard
  return (
    <>
      <div className="space-y-8">
      {/* Page Header with Test Payment Button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Personal Dashboard</h1>
        <TestPaymentButton />
      </div>
      
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">+2 since last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Organizations you're in</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Usage</CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24.8k</div>
            <p className="text-xs text-muted-foreground">+12.5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+3 in progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
        <BarChartBetter />
      </div>

      {/* Projects Section */}
      <div>
        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Latest Projects</CardTitle>
              <CardDescription>Recent projects generated by Titan</CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/dashboard/projects">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <div className="flex flex-1 items-center justify-center rounded-lg p-8">
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-xl font-bold tracking-tight">You have no projects</h1>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Projects will show when you start using Titan
                  </p>
                  <Button>
                    <Link href="/dashboard/projects/new">Create New Project</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organization Switcher CTA */}
      <Card>
        <CardHeader>
          <CardTitle>Working with a team?</CardTitle>
          <CardDescription>
            Switch to an organization context to access team features and collaborative tools.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href="/dashboard?create-org=true">
              Create Organization
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>

    {/* Organization Creation Modal */}
    <Dialog open={showCreateOrg} onOpenChange={setShowCreateOrg}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Organization</DialogTitle>
          <DialogDescription>
            Set up a new organization to collaborate with your team and manage projects together.
          </DialogDescription>
        </DialogHeader>
        <OrganizationCreationForm 
          onSuccess={handleOrgCreated}
          onCancel={handleCloseModal}
        />
      </DialogContent>
    </Dialog>
    </>
  );
} 