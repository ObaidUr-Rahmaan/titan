'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrganization } from '@clerk/nextjs';
import { 
  Loader2, 
  Building2, 
  AlertCircle, 
  CheckCircle, 
  Settings, 
  Palette,
  Users,
  Shield,
  Globe
} from 'lucide-react';
import { updateOrganization, getOrganizationById, type OrganizationWithMembership } from '@/utils/actions/organizations';

// Form validation schema
const organizationSettingsSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  websiteUrl: z.string().url('Invalid website URL').optional().or(z.literal('')),
});

type OrganizationSettingsForm = z.infer<typeof organizationSettingsSchema>;

interface OrganizationSettingsProps {
  organizationId?: string;
  onUpdate?: () => void;
}

export function OrganizationSettings({ organizationId, onUpdate }: OrganizationSettingsProps) {
  const { organization: clerkOrg } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [organizationData, setOrganizationData] = useState<OrganizationWithMembership | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty }
  } = useForm<OrganizationSettingsForm>({
    resolver: zodResolver(organizationSettingsSchema),
    defaultValues: {
      name: '',
      description: '',
      websiteUrl: '',
    }
  });

  const targetOrgId = organizationId || clerkOrg?.id;

  // Load organization data
  useEffect(() => {
    async function loadOrganization() {
      if (!targetOrgId) return;

      setInitialLoading(true);
      setError(null);

      try {
        const orgId = parseInt(targetOrgId, 10);
        if (isNaN(orgId)) {
          setError('Invalid organization ID');
          return;
        }

        const result = await getOrganizationById(orgId);
        
        if (!result.success) {
          setError(result.error || 'Failed to load organization');
          return;
        }

        const org = result.data;
        if (!org) {
          setError('Organization data not found');
          return;
        }

        setOrganizationData(org);

        // Populate form with existing data
        setValue('name', org.name || '');
        setValue('description', org.description || '');
        setValue('websiteUrl', org.websiteUrl || '');
      } catch (err) {
        setError('Failed to load organization data');
        console.error('Load organization error:', err);
      } finally {
        setInitialLoading(false);
      }
    }

    loadOrganization();
  }, [targetOrgId, setValue]);

  const onSubmit = async (data: OrganizationSettingsForm) => {
    if (!targetOrgId) {
      setError('No organization selected');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const orgId = parseInt(targetOrgId, 10);
      if (isNaN(orgId)) {
        setError('Invalid organization ID');
        return;
      }

      const result = await updateOrganization(orgId, data);

      if (!result.success) {
        setError(result.error || 'Failed to update organization');
        return;
      }

      setSuccess('Organization updated successfully!');
      onUpdate?.();

      // Update local data
      setOrganizationData((prev) => prev ? { ...prev, ...data } : null);
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Update organization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrganization = async () => {
    // TODO: Implement delete organization functionality
    // This would require additional confirmation dialog
    console.log('Delete organization not implemented yet');
  };

  if (initialLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading organization settings...</span>
        </CardContent>
      </Card>
    );
  }

  if (!targetOrgId) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Organization Selected</h3>
            <p className="text-muted-foreground">
              Please select an organization to manage its settings.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Organization Settings</h1>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>
                Manage your organization's basic information and settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">{success}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Enter organization name"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Describe your organization..."
                    rows={3}
                    className={errors.description ? 'border-red-500' : ''}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600">{errors.description.message}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {watch('description')?.length || 0}/500 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">Website URL</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="websiteUrl"
                      {...register('websiteUrl')}
                      placeholder="https://example.com"
                      className={`pl-10 ${errors.websiteUrl ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.websiteUrl && (
                    <p className="text-sm text-red-600">{errors.websiteUrl.message}</p>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={loading || !isDirty}
                    className="flex items-center gap-2"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => window.location.reload()}
                    disabled={loading}
                  >
                    Reset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Organization Info Display */}
          {organizationData && (
            <Card>
              <CardHeader>
                <CardTitle>Organization Details</CardTitle>
                <CardDescription>
                  Current organization information and metadata.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Organization ID</Label>
                    <p className="font-mono text-xs bg-muted px-2 py-1 rounded">
                      {organizationData.id}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Clerk ID</Label>
                    <p className="font-mono text-xs bg-muted px-2 py-1 rounded">
                      {organizationData.clerkOrganizationId}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Created</Label>
                    <p>{organizationData.createdTime ? new Date(organizationData.createdTime).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Last Updated</Label>
                    <p>{organizationData.updatedTime ? new Date(organizationData.updatedTime).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Branding & Appearance</CardTitle>
              <CardDescription>
                Customize your organization's visual identity and branding.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8 text-muted-foreground">
                <Palette className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Branding Settings</h3>
                <p>Branding customization features coming soon.</p>
                <p className="text-sm">This will include logo upload, color themes, and custom styling options.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Member Management</CardTitle>
              <CardDescription>
                Manage organization members, roles, and permissions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Member Settings</h3>
                <p>Member management features available in dedicated components.</p>
                <p className="text-sm">Use the Organization Member List and Invitation components for full member management.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security & Privacy</CardTitle>
              <CardDescription>
                Configure security settings and privacy options for your organization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Security Settings</h3>
                <p>Advanced security features coming soon.</p>
                <p className="text-sm">This will include SSO configuration, IP restrictions, and audit logs.</p>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible and destructive actions for this organization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <h4 className="font-semibold text-red-800 mb-2">Delete Organization</h4>
                  <p className="text-sm text-red-700 mb-4">
                    This action cannot be undone. This will permanently delete the organization and all associated data.
                  </p>
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteOrganization}
                    disabled={true} // Disabled until proper implementation
                  >
                    Delete Organization
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 