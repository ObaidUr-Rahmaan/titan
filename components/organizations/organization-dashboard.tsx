'use client';

import { useState, useEffect } from 'react';
import { useOrganization } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Building2, 
  Activity, 
  TrendingUp, 
  Calendar,
  UserPlus,
  Settings,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface OrganizationStats {
  totalMembers: number;
  activeMembers: number;
  pendingInvitations: number;
  projectsCount: number;
  monthlyGrowth: number;
  lastActivity: Date;
}

interface ActivityItem {
  id: string;
  type: 'member_joined' | 'member_invited' | 'project_created' | 'settings_updated';
  message: string;
  timestamp: Date;
  user?: {
    name: string;
    imageUrl?: string;
  };
}

interface OrganizationDashboardProps {
  className?: string;
  showDetailedStats?: boolean;
  showActivityFeed?: boolean;
  showQuickActions?: boolean;
}

export function OrganizationDashboard({
  className,
  showDetailedStats = true,
  showActivityFeed = true,
  showQuickActions = true
}: OrganizationDashboardProps) {
  const { organization, membership, isLoaded } = useOrganization();
  const [stats, setStats] = useState<OrganizationStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulate data loading (replace with actual API calls)
  useEffect(() => {
    if (organization && isLoaded) {
      // Simulate API call to get organization stats
      setTimeout(() => {
        setStats({
          totalMembers: organization.membersCount || 5,
          activeMembers: Math.floor((organization.membersCount || 5) * 0.8),
          pendingInvitations: 2,
          projectsCount: 12,
          monthlyGrowth: 15.5,
          lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
        });

        setActivities([
          {
            id: '1',
            type: 'member_joined',
            message: 'John Doe joined the organization',
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
            user: { name: 'John Doe', imageUrl: '/avatars/john.jpg' }
          },
          {
            id: '2',
            type: 'project_created',
            message: 'New project "API Gateway" was created',
            timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
            user: { name: 'Sarah Chen', imageUrl: '/avatars/sarah.jpg' }
          },
          {
            id: '3',
            type: 'member_invited',
            message: 'Invitation sent to alex@company.com',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
            user: { name: 'Mike Wilson' }
          },
          {
            id: '4',
            type: 'settings_updated',
            message: 'Organization settings updated',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
            user: { name: 'Admin User' }
          }
        ]);

        setLoading(false);
      }, 1000);
    }
  }, [organization, isLoaded]);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'member_joined':
        return <UserPlus className="w-4 h-4 text-green-500" />;
      case 'member_invited':
        return <UserPlus className="w-4 h-4 text-blue-500" />;
      case 'project_created':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'settings_updated':
        return <Settings className="w-4 h-4 text-gray-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (!isLoaded || !organization) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Organization Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {organization.imageUrl ? (
              <img 
                src={organization.imageUrl} 
                alt={organization.name}
                className="w-8 h-8 rounded-lg"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-blue-600" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{organization.name}</h1>
              <p className="text-sm text-muted-foreground">
                Organization Dashboard
              </p>
            </div>
          </div>
          {membership && (
            <Badge variant={membership.role === 'org:admin' ? 'default' : 'secondary'}>
              {membership.role === 'org:admin' ? 'Admin' : 'Member'}
            </Badge>
          )}
        </div>

        {showQuickActions && membership?.role === 'org:admin' && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </Button>
            <Button size="sm">
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Members
            </Button>
          </div>
        )}
      </div>

      {/* Organization Stats */}
      {showDetailedStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.totalMembers}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.activeMembers} active
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.pendingInvitations}</div>
                  <p className="text-xs text-muted-foreground">
                    Awaiting response
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projects</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.projectsCount}</div>
                  <p className="text-xs text-muted-foreground">
                    +{stats?.monthlyGrowth}% this month
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {stats ? formatTimeAgo(stats.lastActivity) : '--'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Member activity
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activity Feed */}
      {showActivityFeed && (
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-2">
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates in your organization</CardDescription>
              </div>
              <Button asChild size="sm" className="ml-auto gap-1">
                <Link href="/dashboard/activity">
                  View All
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))
                ) : activities.length > 0 ? (
                  activities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {activity.user?.imageUrl ? (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={activity.user.imageUrl} alt={activity.user.name} />
                            <AvatarFallback>
                              {activity.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                            {getActivityIcon(activity.type)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500">
                          {formatTimeAgo(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common organization management tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/members/invite">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite New Members
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/projects/new">
                  <Building2 className="w-4 h-4 mr-2" />
                  Create New Project
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Organization Settings
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/analytics">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default OrganizationDashboard; 