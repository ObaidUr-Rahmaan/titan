import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { getOrganizationBySlug } from '@/utils/actions/organizations';
import { requireOrganization } from '@/utils/auth/organization-helpers';
import OrgDashboardTopNav from './_components/org-dashboard-top-nav';
import { OrganizationProvider } from './_components/organization-provider';

interface OrganizationLayoutProps {
  children: ReactNode;
  params: {
    orgSlug: string;
  };
}

export default async function OrganizationLayout({ 
  children, 
  params 
}: OrganizationLayoutProps) {
  try {
    // Get current user
    const user = await currentUser();
    if (!user) {
      redirect('/sign-in');
    }

    // Get organization by slug and validate membership
    const orgResult = await getOrganizationBySlug(params.orgSlug);
    if (!orgResult.success || !orgResult.data) {
      // Organization not found or user doesn't have access
      redirect('/dashboard?error=organization-not-found');
    }

    const organization = orgResult.data;

    // Validate user has access to this organization
    // requireOrganization will throw an error if user doesn't have access
    await requireOrganization(organization.clerkOrganizationId);

    return (
      <OrganizationProvider organizationId={organization.id.toString()} organizationSlug={params.orgSlug}>
        <div className="min-h-screen w-full bg-background">
          <OrgDashboardTopNav organization={organization}>
            <main className="mx-auto max-w-7xl w-full p-4 sm:p-6 lg:p-8">
              {children}
            </main>
          </OrgDashboardTopNav>
        </div>
      </OrganizationProvider>
    );
  } catch (error) {
    console.error("Error in organization layout:", error);
    
    return (
      <div className="min-h-screen w-full bg-background">
        <main className="mx-auto max-w-7xl w-full p-4 sm:p-6 lg:p-8">
          <h1>Something went wrong</h1>
          <p>Unable to load organization. Please try again.</p>
        </main>
      </div>
    );
  }
} 