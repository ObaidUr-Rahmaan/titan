'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUserActivityHistory, getUserActivityStats, logUserActivity } from '@/utils/actions/shared/activity-logger'
import { useUser } from '@clerk/nextjs'

interface ActivityQueryOptions {
  category?: string
  activityType?: string
  limit?: number
  offset?: number
  startDate?: Date
  endDate?: Date
}

interface LogActivityData {
  activityType: string
  category?: string
  title: string
  description?: string
  metadata?: Record<string, any>
  source?: 'web' | 'api' | 'webhook' | 'admin' | 'cron'
  relatedEntityType?: string
  relatedEntityId?: string
}

/**
 * Hook to fetch user activity history
 */
export function useUserActivity(options: ActivityQueryOptions = {}) {
  const { user } = useUser()
  
  return useQuery({
    queryKey: ['user-activity', user?.id, options],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')
      
      const result = await getUserActivityHistory(user.id, options)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch user activity')
      }
      
      return {
        activities: result.activities || [],
        total: result.total || 0
      }
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false
  })
}

/**
 * Hook to fetch user activity statistics
 */
export function useUserActivityStats(days: number = 30) {
  const { user } = useUser()
  
  return useQuery({
    queryKey: ['user-activity-stats', user?.id, days],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')
      
      const result = await getUserActivityStats(user.id, days)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch activity stats')
      }
      
      return result.stats || {}
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  })
}

/**
 * Hook to log user activity
 */
export function useLogActivity() {
  const { user } = useUser()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: LogActivityData) => {
      if (!user?.id) throw new Error('User not authenticated')
      
      const result = await logUserActivity({
        ...data,
        userId: user.id,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        ipAddress: undefined // Will be handled server-side if needed
      })
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to log activity')
      }
      
      return result
    },
    onSuccess: () => {
      // Invalidate and refetch activity queries
      queryClient.invalidateQueries({ queryKey: ['user-activity'] })
      queryClient.invalidateQueries({ queryKey: ['user-activity-stats'] })
    }
  })
}

/**
 * Hook to get recent billing activities
 */
export function useRecentBillingActivity(limit: number = 10) {
  return useUserActivity({
    category: 'billing',
    limit,
    offset: 0
  })
}

/**
 * Hook to get recent authentication activities
 */
export function useRecentAuthActivity(limit: number = 10) {
  return useUserActivity({
    category: 'authentication',
    limit,
    offset: 0
  })
}

/**
 * Hook to get recent system errors
 */
export function useRecentSystemErrors(limit: number = 10) {
  return useUserActivity({
    category: 'system',
    activityType: 'system_error',
    limit,
    offset: 0
  })
}

/**
 * Hook to get activity by date range
 */
export function useActivityByDateRange(startDate: Date, endDate: Date, category?: string) {
  return useUserActivity({
    startDate,
    endDate,
    category,
    limit: 100
  })
}

/**
 * Hook for paginated activity history
 */
export function usePaginatedActivity(
  page: number = 0, 
  pageSize: number = 20, 
  category?: string
) {
  const offset = page * pageSize
  
  return useUserActivity({
    category,
    limit: pageSize,
    offset
  })
}

/**
 * Convenience hook to log common activities
 */
export function useActivityLogger() {
  const logActivity = useLogActivity()
  
  const logProfileUpdate = (description?: string) => {
    return logActivity.mutate({
      activityType: 'profile_updated',
      category: 'profile',
      title: 'Profile updated',
      description: description || 'User profile information was updated',
      source: 'web'
    })
  }
  
  const logSettingsChange = (settingName: string, description?: string) => {
    return logActivity.mutate({
      activityType: 'settings_updated',
      category: 'settings',
      title: `Settings updated: ${settingName}`,
      description: description || `User updated ${settingName} setting`,
      metadata: { settingName },
      source: 'web'
    })
  }
  
  const logSecurityEvent = (eventType: string, description: string) => {
    return logActivity.mutate({
      activityType: 'security_event',
      category: 'security',
      title: `Security event: ${eventType}`,
      description,
      metadata: { eventType },
      source: 'web'
    })
  }
  
  const logApiRequest = (endpoint: string, method: string, success: boolean) => {
    return logActivity.mutate({
      activityType: success ? 'api_request' : 'api_error',
      category: 'api',
      title: `${method.toUpperCase()} ${endpoint}`,
      description: `API request ${success ? 'succeeded' : 'failed'}`,
      metadata: { endpoint, method, success },
      source: 'web'
    })
  }
  
  return {
    logActivity: logActivity.mutate,
    logProfileUpdate,
    logSettingsChange,
    logSecurityEvent,
    logApiRequest,
    isLogging: logActivity.isPending
  }
} 