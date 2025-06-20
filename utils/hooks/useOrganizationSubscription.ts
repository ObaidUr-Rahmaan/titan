'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOrganization } from '@clerk/nextjs'
import { useOrganizationContext } from '@/app/org/[orgSlug]/_components/organization-provider'

/**
 * Hook for managing organization subscription status
 */
export function useOrganizationSubscription() {
  const { organization } = useOrganization()
  const { state } = useOrganizationContext()
  const queryClient = useQueryClient()
  
  const organizationId = state.organizationId
  
  // Query for organization subscription data
  const {
    data: subscriptionData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['organization-subscription', organizationId],
    queryFn: async () => {
      if (!organizationId) return null
      
      const response = await fetch(`/api/organizations/${organizationId}/subscriptions`)
      if (!response.ok) {
        throw new Error('Failed to fetch organization subscription')
      }
      
      return response.json()
    },
    enabled: !!organizationId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  })

  // Mutation for updating subscription
  const updateSubscription = useMutation({
    mutationFn: async (params: {
      action: 'add_seats' | 'remove_seats' | 'change_plan' | 'update_billing'
      seatCount?: number
      planId?: string
      autoAddSeats?: boolean
      billingEmail?: string
    }) => {
      if (!organizationId) throw new Error('Organization not found')
      
      const response = await fetch(`/api/organizations/${organizationId}/subscriptions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update subscription')
      }
      
      return response.json()
    },
    onSuccess: () => {
      // Invalidate organization subscription queries
      queryClient.invalidateQueries({ queryKey: ['organization-subscription'] })
      queryClient.invalidateQueries({ queryKey: ['organization-data'] })
    },
  })

  // Mutation for creating billing portal session
  const createBillingPortal = useMutation({
    mutationFn: async () => {
      if (!organizationId) throw new Error('Organization not found')
      
      const response = await fetch(`/api/organizations/${organizationId}/billing-portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to create billing portal session')
      }
      
      const { url } = await response.json()
      window.location.href = url
    },
  })

  // Extract subscription details
  const subscription = subscriptionData?.subscription
  const organization_data = subscriptionData?.organization
  
  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing'
  const isTrial = organization_data?.isTrial || subscription?.status === 'trialing'
  const isExpired = organization_data?.subscriptionStatus === 'canceled' || 
                   organization_data?.subscriptionStatus === 'past_due'
  
  // Seat management
  const totalSeats = subscription?.seatLimit || organization_data?.memberLimit || 0
  const usedSeats = subscription?.usedSeats || state.stats.totalMembers || 0
  const availableSeats = Math.max(0, totalSeats - usedSeats)
  const seatUtilization = totalSeats > 0 ? (usedSeats / totalSeats) * 100 : 0
  
  // Feature access based on plan
  const hasFeature = (feature: string) => {
    const plan = subscription?.planId || organization_data?.subscriptionTier
    
    if (!plan || plan === 'free') return false
    
    // Basic organization features
    const basicFeatures = ['team_collaboration', 'basic_analytics', 'email_support']
    if (basicFeatures.includes(feature)) return true
    
    // Pro features
    const proFeatures = ['advanced_analytics', 'priority_support', 'api_access', 'custom_branding']
    if ((plan === 'pro' || plan === 'business') && proFeatures.includes(feature)) return true
    
    // Business features
    const businessFeatures = [...proFeatures, 'white_label', 'custom_integrations', 'advanced_security']
    if (plan === 'business' && businessFeatures.includes(feature)) return true
    
    return false
  }

  return {
    // Data
    subscription,
    organization: organization_data,
    isActive,
    isTrial,
    isExpired,
    
    // Seat management
    totalSeats,
    usedSeats,
    availableSeats,
    seatUtilization,
    nearSeatLimit: seatUtilization > 80,
    atSeatLimit: usedSeats >= totalSeats,
    
    // Status
    isLoading,
    error,
    
    // Actions
    refetch,
    updateSubscription: updateSubscription.mutate,
    isUpdating: updateSubscription.isPending,
    openBillingPortal: createBillingPortal.mutate,
    isOpeningPortal: createBillingPortal.isPending,
    
    // Helper functions
    hasFeature,
    
    canAddSeats: () => {
      return isActive && (subscription?.autoAddSeats || !subscription?.seatLimit)
    },
    
    canUpgrade: () => {
      const plan = subscription?.planId || organization_data?.subscriptionTier
      return !plan || plan === 'free' || plan === 'basic'
    },
    
    canDowngrade: () => {
      const plan = subscription?.planId || organization_data?.subscriptionTier
      return plan === 'pro' || plan === 'business'
    },
    
    getBillingStatus: () => {
      if (isTrial) return { status: 'trial', color: 'blue' }
      if (isExpired) return { status: 'expired', color: 'red' }
      if (isActive) return { status: 'active', color: 'green' }
      return { status: 'inactive', color: 'gray' }
    }
  }
}

/**
 * Hook for organization feature access
 */
export function useOrganizationFeatureAccess(feature: string) {
  const { hasFeature, isLoading } = useOrganizationSubscription()
  
  return {
    hasAccess: hasFeature(feature),
    isLoading,
  }
}

/**
 * Hook for organization subscription limits
 */
export function useOrganizationLimits() {
  const { subscription, organization } = useOrganizationSubscription()
  
  const getLimits = () => {
    const plan = subscription?.planId || organization?.subscriptionTier
    
    switch (plan) {
      case 'trial':
        return {
          members: 5,
          projects: 3,
          storage: '1GB',
          apiCalls: 5000,
        }
      case 'basic':
        return {
          members: 10,
          projects: 10,
          storage: '5GB',
          apiCalls: 25000,
        }
      case 'pro':
        return {
          members: 50,
          projects: 50,
          storage: '50GB',
          apiCalls: 250000,
        }
      case 'business':
        return {
          members: -1, // Unlimited
          projects: -1, // Unlimited
          storage: '500GB',
          apiCalls: 2500000,
        }
      default:
        return {
          members: 1,
          projects: 1,
          storage: '100MB',
          apiCalls: 1000,
        }
    }
  }

  return {
    limits: getLimits(),
    plan: subscription?.planId || organization?.subscriptionTier,
  }
} 