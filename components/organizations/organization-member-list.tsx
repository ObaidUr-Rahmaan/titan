'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
// Select component will be added in future iteration
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useOrganization } from '@clerk/nextjs';
import { 
  Loader2, 
  Users, 
  Search,
  MoreHorizontal,
  UserPlus,
  Mail,
  Calendar,
  Shield,
  Crown,
  User,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { getOrganizationMembers } from '@/utils/actions/organizations';

// Role configurations
const ROLE_CONFIG = {
  owner: {
    label: 'Owner',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Crown,
  },
  admin: {
    label: 'Admin',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: Shield,
  },
  member: {
    label: 'Member',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: User,
  }
} as const;

type RoleType = keyof typeof ROLE_CONFIG;

interface OrganizationMember {
  id: number;
  userId: string;
  firstName?: string;
  lastName?: string;
  email: string;
  imageUrl?: string;
  role: string;
  joinedAt: Date | null;
  lastActiveAt?: Date | null;
  status: 'active' | 'pending' | 'inactive';
}

interface OrganizationMemberListProps {
  organizationId?: string;
  onInviteMember?: () => void;
  showInviteButton?: boolean;
}

export function OrganizationMemberList({ 
  organizationId, 
  onInviteMember,
  showInviteButton = true 
}: OrganizationMemberListProps) {
  const { organization: clerkOrg } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<OrganizationMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const targetOrgId = organizationId || clerkOrg?.id;

  // Load organization members
  useEffect(() => {
    async function loadMembers() {
      if (!targetOrgId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const orgId = parseInt(targetOrgId, 10);
        if (isNaN(orgId)) {
          setError('Invalid organization ID');
          return;
        }

        const result = await getOrganizationMembers(orgId);
        
        if (!result.success) {
          setError(result.error || 'Failed to load members');
          return;
        }

        // Transform the data to match our interface
        const transformedMembers: OrganizationMember[] = (result.data || []).map((member: any) => ({
          id: member.membership?.id || 0,
          userId: member.user?.userId || '',
          firstName: member.user?.firstName || '',
          lastName: member.user?.lastName || '',
          email: member.user?.email || '',
          imageUrl: member.user?.imageUrl || '',
          role: member.membership?.role || 'member',
          joinedAt: member.membership?.joinedAt || null,
          lastActiveAt: member.user?.lastActiveAt || null,
          status: 'active' as const, // Default to active for now
        }));

        setMembers(transformedMembers);
        setFilteredMembers(transformedMembers);
      } catch (err) {
        setError('Failed to load organization members');
        console.error('Load members error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadMembers();
  }, [targetOrgId]);

  // Filter members based on search and filters
  useEffect(() => {
    let filtered = members;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(member => {
        const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
        const email = member.email.toLowerCase();
        const search = searchTerm.toLowerCase();
        return fullName.includes(search) || email.includes(search);
      });
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(member => member.role === roleFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(member => member.status === statusFilter);
    }

    setFilteredMembers(filtered);
  }, [members, searchTerm, roleFilter, statusFilter]);

  const handleRefresh = () => {
    // Trigger a reload of the members
    if (targetOrgId) {
      setLoading(true);
      // Re-trigger the useEffect by updating a dependency
      window.location.reload();
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '??';
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleConfig = (role: string) => {
    return ROLE_CONFIG[role as RoleType] || ROLE_CONFIG.member;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading members...</span>
        </CardContent>
      </Card>
    );
  }

  if (!targetOrgId) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Organization Selected</h3>
            <p className="text-muted-foreground">
              Please select an organization to view its members.
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
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Organization Members</h1>
          <Badge variant="secondary" className="ml-2">
            {members.length} member{members.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          {showInviteButton && (
            <Button
              onClick={onInviteMember}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Invite Member
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>Search and filter organization members</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Role Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-40">
                  {roleFilter === 'all' ? 'All Roles' : roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setRoleFilter('all')}>All Roles</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter('owner')}>Owner</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter('admin')}>Admin</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRoleFilter('member')}>Member</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Status Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-40">
                  {statusFilter === 'all' ? 'All Status' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>All Status</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('active')}>Active</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('pending')}>Pending</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('inactive')}>Inactive</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Filter Summary */}
          {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all') && (
            <div className="text-sm text-muted-foreground">
              Showing {filteredMembers.length} of {members.length} members
              {searchTerm && ` matching "${searchTerm}"`}
              {roleFilter !== 'all' && ` with role "${roleFilter}"`}
              {statusFilter !== 'all' && ` with status "${statusFilter}"`}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            Manage your organization members and their roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {members.length === 0 ? 'No Members Found' : 'No Results'}
              </h3>
              <p className="text-muted-foreground">
                {members.length === 0 
                  ? 'This organization doesn\'t have any members yet.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMembers.map((member, index) => {
                const roleConfig = getRoleConfig(member.role);
                const RoleIcon = roleConfig.icon;

                return (
                  <div key={member.id || index}>
                    <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.imageUrl} alt={`${member.firstName} ${member.lastName}`} />
                          <AvatarFallback>
                            {getInitials(member.firstName, member.lastName)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {member.firstName && member.lastName 
                                ? `${member.firstName} ${member.lastName}`
                                : member.email
                              }
                            </span>
                            <Badge variant="outline" className={`text-xs ${roleConfig.color} border`}>
                              <RoleIcon className="h-3 w-3 mr-1" />
                              {roleConfig.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {member.email}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Joined {formatDate(member.joinedAt)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem disabled>
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled>
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem disabled className="text-red-600">
                            Remove Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {index < filteredMembers.length - 1 && (
                      <Separator className="my-2" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Member Statistics */}
      {members.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Member Statistics</CardTitle>
            <CardDescription>Overview of your organization membership</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">
                  {members.length}
                </div>
                <div className="text-sm text-muted-foreground">Total Members</div>
              </div>
              <div className="text-center p-4 rounded-lg border">
                <div className="text-2xl font-bold text-purple-600">
                  {members.filter(m => m.role === 'owner').length}
                </div>
                <div className="text-sm text-muted-foreground">Owners</div>
              </div>
              <div className="text-center p-4 rounded-lg border">
                <div className="text-2xl font-bold text-red-600">
                  {members.filter(m => m.role === 'admin').length}
                </div>
                <div className="text-sm text-muted-foreground">Admins</div>
              </div>
              <div className="text-center p-4 rounded-lg border">
                <div className="text-2xl font-bold text-green-600">
                  {members.filter(m => m.status === 'active').length}
                </div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 