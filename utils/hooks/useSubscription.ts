'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@clerk/nextjs'
import { getUserSubscriptionStatus, hasActiveSubscription, isInTrialPeriod } from '@/utils/data/user/subscription-status'

/**
 * Hook for managing subscription status with real-time updates
 */
export function useSubscription() {
  const { user } = useUser()
  const queryClient = useQueryClient()
  
  // Query for subscription status
  const {
    data: subscriptionData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      return getUserSubscriptionStatus(user.id)
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  })

  // Query for active subscription check
  const { data: hasActive } = useQuery({
    queryKey: ['subscription-active', user?.id],
    queryFn: async () => {
      if (!user?.id) return false
      return hasActiveSubscription(user.id)
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  })

  // Query for trial status check
  const { data: inTrial } = useQuery({
    queryKey: ['subscription-trial', user?.id],
    queryFn: async () => {
      if (!user?.id) return false
      return isInTrialPeriod(user.id)
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  })

  // Mutation for refreshing subscription data
  const refreshSubscription = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')
      return getUserSubscriptionStatus(user.id)
    },
    onSuccess: () => {
      // Invalidate all subscription-related queries
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
      queryClient.invalidateQueries({ queryKey: ['subscription-active'] })
      queryClient.invalidateQueries({ queryKey: ['subscription-trial'] })
    },
  })

  // Helper functions
  const subscription = subscriptionData?.success ? subscriptionData.data?.subscription : null
  const isActive = hasActive || false
  const isTrial = inTrial || false
  const isFree = subscription === 'free' || subscription === null

  return {
    // Data
    subscription,
    subscriptionData: subscriptionData?.data,
    isActive,
    isTrial,
    isFree,
    
    // Status
    isLoading,
    error,
    
    // Actions
    refetch,
    refresh: refreshSubscription.mutate,
    isRefreshing: refreshSubscription.isPending,
    
    // Helper functions
    hasFeature: (feature: string) => {
      // Add feature checking logic based on subscription tier
      if (!subscription || subscription === 'free') return false
      
      // Basic features available to all paid plans
      const basicFeatures = ['basic_analytics', 'email_support']
      if (basicFeatures.includes(feature)) return true
      
      // Pro features
      const proFeatures = ['advanced_analytics', 'priority_support', 'api_access']
      if (subscription === 'pro' && proFeatures.includes(feature)) return true
      
      // Business features (includes all pro features)
      const businessFeatures = [...proFeatures, 'white_label', 'custom_integrations']
      if (subscription === 'business' && businessFeatures.includes(feature)) return true
      
      return false
    },
    
    canUpgrade: () => {
      return subscription === 'free' || subscription === 'trial' || subscription === 'basic'
    },
    
    canDowngrade: () => {
      return subscription === 'pro' || subscription === 'business'
    },
  }
}

/**
 * Hook for subscription-based feature gating
 */
export function useFeatureAccess(feature: string) {
  const { hasFeature, isLoading } = useSubscription()
  
  return {
    hasAccess: hasFeature(feature),
    isLoading,
  }
}

/**
 * Hook for subscription plan limits
 */
export function useSubscriptionLimits() {
  const { subscription } = useSubscription()
  
  const getLimits = () => {
    switch (subscription) {
      case 'trial':
        return {
          projects: 1,
          users: 1,
          storage: '100MB',
          apiCalls: 1000,
        }
      case 'basic':
        return {
          projects: 5,
          users: 3,
          storage: '1GB',
          apiCalls: 10000,
        }
      case 'pro':
        return {
          projects: 25,
          users: 10,
          storage: '10GB',
          apiCalls: 100000,
        }
      case 'business':
        return {
          projects: -1, // Unlimited
          users: -1, // Unlimited
          storage: '100GB',
          apiCalls: 1000000,
        }
      default:
        return {
          projects: 0,
          users: 0,
          storage: '0MB',
          apiCalls: 0,
        }
    }
  }

  return {
    limits: getLimits(),
    subscription,
  }
} 