'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useOrganizationSubscription } from '@/utils/hooks/useOrganizationSubscription'
import { CreditCard, Users, TrendingUp, Settings, AlertTriangle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export function OrganizationSubscriptionCard() {
  const {
    subscription,
    organization,
    isActive,
    isTrial,
    isExpired,
    totalSeats,
    usedSeats,
    availableSeats,
    seatUtilization,
    nearSeatLimit,
    atSeatLimit,
    isLoading,
    error,
    openBillingPortal,
    isOpeningPortal,
    canUpgrade,
    canDowngrade,
    getBillingStatus
  } = useOrganizationSubscription()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-48 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-16 bg-muted animate-pulse rounded" />
            <div className="h-12 bg-muted animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <AlertTriangle size={20} />
            Subscription Error
          </CardTitle>
          <CardDescription>
            Unable to load subscription data. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const billingStatus = getBillingStatus()
  const currentPlan = subscription?.planId || organization?.subscriptionTier || 'free'

  const handleBillingPortal = async () => {
    try {
      await openBillingPortal()
    } catch (error) {
      toast.error('Failed to open billing portal. Please try again.')
    }
  }

  const getPlanDisplayName = (plan: string) => {
    switch (plan) {
      case 'trial': return 'Trial'
      case 'basic': return 'Basic'
      case 'pro': return 'Pro'
      case 'business': return 'Business'
      default: return 'Free'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard size={20} />
              Organization Subscription
            </CardTitle>
            <CardDescription>
              Manage your organization's billing and plan
            </CardDescription>
          </div>
          <Badge 
            variant={
              billingStatus.color === 'green' ? 'default' :
              billingStatus.color === 'blue' ? 'secondary' :
              billingStatus.color === 'red' ? 'destructive' : 'outline'
            }
          >
            {billingStatus.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Plan Info */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <h3 className="font-semibold">{getPlanDisplayName(currentPlan)} Plan</h3>
            {subscription?.amount && (
              <p className="text-sm text-muted-foreground">
                {formatCurrency(subscription.amount)}/{subscription.interval || 'month'}
              </p>
            )}
            {isTrial && (
              <p className="text-sm text-blue-600">
                Trial ends: {subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'Soon'}
              </p>
            )}
          </div>
          <div className="text-right">
            {isActive && (
              <CheckCircle className="text-green-500" size={24} />
            )}
            {isExpired && (
              <AlertTriangle className="text-red-500" size={24} />
            )}
          </div>
        </div>

        {/* Seat Usage */}
        {totalSeats > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                <Users size={16} />
                Seat Usage
              </h4>
              <span className="text-sm text-muted-foreground">
                {usedSeats} of {totalSeats} seats used
              </span>
            </div>
            
            <Progress 
              value={seatUtilization} 
              className={`h-2 ${
                atSeatLimit ? 'bg-red-100' : 
                nearSeatLimit ? 'bg-yellow-100' : 
                'bg-green-100'
              }`}
            />
            
            {nearSeatLimit && !atSeatLimit && (
              <div className="flex items-center gap-2 text-sm text-yellow-600">
                <AlertTriangle size={14} />
                Approaching seat limit
              </div>
            )}
            
            {atSeatLimit && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertTriangle size={14} />
                Seat limit reached - upgrade to add more members
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleBillingPortal}
            disabled={isOpeningPortal}
            className="flex items-center gap-2"
            variant="outline"
          >
            <Settings size={16} />
            {isOpeningPortal ? 'Opening...' : 'Manage Billing'}
          </Button>
          
          {canUpgrade() && (
            <Button 
              className="flex items-center gap-2"
              onClick={handleBillingPortal}
            >
              <TrendingUp size={16} />
              Upgrade Plan
            </Button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold">{usedSeats}</p>
            <p className="text-sm text-muted-foreground">Active Members</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{availableSeats}</p>
            <p className="text-sm text-muted-foreground">Available Seats</p>
          </div>
        </div>

        {/* Renewal/Trial Info */}
        {subscription?.endDate && (
          <div className="text-sm text-muted-foreground text-center pt-2 border-t">
            {isTrial ? 'Trial ends' : 'Next billing'}: {' '}
            {new Date(subscription.endDate).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 