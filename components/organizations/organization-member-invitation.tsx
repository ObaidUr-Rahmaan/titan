'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useOrganization } from '@clerk/nextjs';
import { 
  Loader2, 
  UserPlus, 
  Mail,
  X,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronDown,
  Copy,
  Send
} from 'lucide-react';

// Form validation schema
const invitationSchema = z.object({
  emails: z.array(z.string().email('Invalid email address')).min(1, 'At least one email is required'),
  role: z.enum(['admin', 'member'], { required_error: 'Please select a role' }),
  message: z.string().optional(),
});

type InvitationFormData = z.infer<typeof invitationSchema>;

// Role configurations
const ROLE_OPTIONS = [
  {
    value: 'admin',
    label: 'Admin',
    description: 'Can manage organization settings and members',
    color: 'bg-red-100 text-red-800',
  },
  {
    value: 'member',
    label: 'Member',
    description: 'Standard access to organization resources',
    color: 'bg-blue-100 text-blue-800',
  },
] as const;

interface OrganizationMemberInvitationProps {
  organizationId?: string;
  onInvitationSent?: (emails: string[], role: string) => void;
  onCancel?: () => void;
  defaultRole?: 'admin' | 'member';
}

export function OrganizationMemberInvitation({ 
  organizationId, 
  onInvitationSent,
  onCancel,
  defaultRole = 'member'
}: OrganizationMemberInvitationProps) {
  const { organization: clerkOrg } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset
  } = useForm<InvitationFormData>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      emails: [],
      role: defaultRole,
      message: '',
    },
  });

  const watchedEmails = watch('emails') || [];
  const watchedRole = watch('role');

  const targetOrgId = organizationId || clerkOrg?.id;

  // Add email to the list
  const addEmail = (email: string) => {
    if (!email.trim()) return;
    
    const trimmedEmail = email.trim().toLowerCase();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    if (watchedEmails.includes(trimmedEmail)) {
      setError('Email already added to the list');
      return;
    }

    const newEmails = [...watchedEmails, trimmedEmail];
    setValue('emails', newEmails);
    setEmailInput('');
    setError(null);
  };

  // Remove email from the list
  const removeEmail = (email: string) => {
    const newEmails = watchedEmails.filter(e => e !== email);
    setValue('emails', newEmails);
  };

  // Handle adding email on Enter key
  const handleEmailKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmail(emailInput);
    }
  };

  // Handle bulk email paste
  const handleEmailPaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text');
    const emails = pastedText
      .split(/[,;\n\r\t\s]+/)
      .map(email => email.trim().toLowerCase())
      .filter(email => email && email.includes('@'));

    if (emails.length > 1) {
      e.preventDefault();
      const validEmails = emails.filter(email => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && !watchedEmails.includes(email);
      });

      if (validEmails.length > 0) {
        setValue('emails', [...watchedEmails, ...validEmails]);
        setEmailInput('');
      }
    }
  };

  // Submit form
  const onSubmit = async (data: InvitationFormData) => {
    if (!targetOrgId) {
      setError('No organization selected');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // For now, we'll simulate the invitation process
      // In a real implementation, this would call a server action
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate success
      setSuccess(`Successfully sent ${data.emails.length} invitation${data.emails.length !== 1 ? 's' : ''}`);
      onInvitationSent?.(data.emails, data.role);
      
      // Reset form
      reset();
      setEmailInput('');
    } catch (err) {
      setError('Failed to send invitations. Please try again.');
      console.error('Invitation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedRoleConfig = ROLE_OPTIONS.find(role => role.value === watchedRole);

  if (!targetOrgId) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Organization Selected</h3>
            <p className="text-muted-foreground">
              Please select an organization to invite members.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserPlus className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Invite Members</h1>
        </div>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>

      {/* Alert Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Invitation Form */}
      <Card>
        <CardHeader>
          <CardTitle>Invite New Members</CardTitle>
          <CardDescription>
            Send invitations to new team members to join your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email-input">Email Addresses</Label>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      id="email-input"
                      type="email"
                      placeholder="Enter email address and press Enter"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      onKeyPress={handleEmailKeyPress}
                      onPaste={handleEmailPaste}
                      className="flex-1"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addEmail(emailInput)}
                    disabled={!emailInput.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  You can paste multiple emails separated by commas, spaces, or new lines
                </p>

                {/* Email List */}
                {watchedEmails.length > 0 && (
                  <div className="space-y-2">
                    <Label>Invitations to send ({watchedEmails.length})</Label>
                    <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg min-h-[60px]">
                      {watchedEmails.map((email) => (
                        <Badge key={email} variant="secondary" className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {email}
                          <button
                            type="button"
                            onClick={() => removeEmail(email)}
                            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {errors.emails && (
                  <p className="text-sm text-destructive">{errors.emails.message}</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Role Selection */}
            <div className="space-y-2">
              <Label>Member Role</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <div className="flex items-center gap-2">
                      {selectedRoleConfig && (
                        <Badge variant="outline" className={selectedRoleConfig.color}>
                          {selectedRoleConfig.label}
                        </Badge>
                      )}
                      {selectedRoleConfig?.description}
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  {ROLE_OPTIONS.map((role) => (
                    <DropdownMenuItem
                      key={role.value}
                      onClick={() => setValue('role', role.value)}
                      className="flex flex-col items-start gap-1 p-3"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={role.color}>
                          {role.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {role.description}
                      </p>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {errors.role && (
                <p className="text-sm text-destructive">{errors.role.message}</p>
              )}
            </div>

            <Separator />

            {/* Custom Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Custom Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Add a personal message to your invitation..."
                {...register('message')}
                rows={4}
              />
              <p className="text-sm text-muted-foreground">
                This message will be included in the invitation email
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={loading || watchedEmails.length === 0}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {loading 
                  ? 'Sending Invitations...' 
                  : `Send ${watchedEmails.length} Invitation${watchedEmails.length !== 1 ? 's' : ''}`
                }
              </Button>
              
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Invitation Preview */}
      {watchedEmails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Invitation Preview</CardTitle>
            <CardDescription>
              This is how your invitation will appear to recipients
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Mail className="h-5 w-5 text-blue-600" />
                <span className="font-semibold">Organization Invitation</span>
              </div>
              
              <p className="mb-3">
                You've been invited to join <strong>{clerkOrg?.name || 'the organization'}</strong> as a{' '}
                <Badge variant="outline" className={selectedRoleConfig?.color}>
                  {selectedRoleConfig?.label}
                </Badge>
              </p>

              {watch('message') && (
                <div className="mb-3 p-3 bg-background rounded border-l-4 border-blue-500">
                  <p className="text-sm font-medium mb-1">Personal Message:</p>
                  <p className="text-sm text-muted-foreground italic">
                    "{watch('message')}"
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Invitation expires in 7 days</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 