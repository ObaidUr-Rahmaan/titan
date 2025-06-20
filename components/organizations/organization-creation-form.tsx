'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import { useOrganization } from '@clerk/nextjs';
import { Loader2, Building2, AlertCircle, CheckCircle } from 'lucide-react';
import { createOrganization } from '@/utils/actions/organizations';

// Form validation schema
const createOrganizationSchema = z.object({
  name: z.string()
    .min(1, 'Organization name is required')
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name must be less than 100 characters'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  websiteUrl: z.string()
    .url('Please enter a valid website URL')
    .optional()
    .or(z.literal('')),
});

type CreateOrganizationFormData = z.infer<typeof createOrganizationSchema>;

interface OrganizationCreationFormProps {
  onSuccess?: (organizationId: number) => void;
  onCancel?: () => void;
  className?: string;
}

export function OrganizationCreationForm({ 
  onSuccess, 
  onCancel, 
  className 
}: OrganizationCreationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const { organization: currentOrg } = useOrganization();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch
  } = useForm<CreateOrganizationFormData>({
    resolver: zodResolver(createOrganizationSchema),
    mode: 'onChange',
  });

  const nameValue = watch('name');
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  const onSubmit = async (data: CreateOrganizationFormData) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Create organization through Clerk first
      const slug = generateSlug(data.name);
      
      const result = await createOrganization({
        name: data.name,
        description: data.description,
        websiteUrl: data.websiteUrl || undefined,
        clerkOrganizationId: '', // Will be set after Clerk creation
      });

      if (!result.success) {
        setError(result.error || 'An error occurred');
        return;
      }

      setSuccess('Organization created successfully!');
      
      // Call success callback if provided
      if (onSuccess && result.data) {
        onSuccess(result.data.id);
      }

      // Reset form
      reset();

      // Redirect to organization dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

    } catch (err) {
      console.error('Error creating organization:', err);
      setError('An unexpected error occurred while creating the organization. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset();
    setError(null);
    setSuccess(null);
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="space-y-1">
        <div className="flex items-center space-x-2">
          <Building2 className="w-6 h-6 text-primary" />
          <CardTitle className="text-2xl">Create Organization</CardTitle>
        </div>
        <CardDescription>
          Set up a new organization to collaborate with your team
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* Organization Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Organization Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Enter your organization name"
              {...register('name')}
              disabled={isSubmitting}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.name.message}
              </p>
            )}
            {nameValue && (
              <p className="text-sm text-muted-foreground">
                URL: {generateSlug(nameValue)}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe what your organization does"
              rows={3}
              {...register('description')}
              disabled={isSubmitting}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Website URL */}
          <div className="space-y-2">
            <Label htmlFor="websiteUrl">Website URL (Optional)</Label>
            <Input
              id="websiteUrl"
              type="url"
              placeholder="https://yourorganization.com"
              {...register('websiteUrl')}
              disabled={isSubmitting}
              className={errors.websiteUrl ? 'border-red-500' : ''}
            />
            {errors.websiteUrl && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.websiteUrl.message}
              </p>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="border-green-500 text-green-700 bg-green-50">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex justify-between space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Organization'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 