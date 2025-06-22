'server only'

import config from '@/config';

/**
 * Quick trial status check for middleware usage
 * Uses API endpoint to avoid edge runtime issues with database clients
 */
export async function isTrialExpiredForUser(userId: string): Promise<boolean> {
  // Skip trial check if disabled in config
  if (!config.auth.trialCheckEnabled) {
    return false;
  }

  try {
    // Use internal API call instead of direct database access to avoid edge runtime issues
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/user/trial-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Request': 'middleware'
      },
      body: JSON.stringify({ userId })
    });

    if (!response.ok) {
      console.error('Failed to check trial status:', response.status);
      return false;
    }

    const data = await response.json();
    
    // Return true if user's trial is expired
    return data.isExpired === true;
    
  } catch (error) {
    console.error('Error checking trial expiration in middleware:', error);
    // Fail open - allow access if we can't check
    return false;
  }
}

/**
 * Get user's subscription status for middleware usage
 */
export async function getUserSubscriptionStatus(userId: string): Promise<{
  isTrial: boolean
  subscriptionStatus: string
  isExpired: boolean
}> {
  // Skip trial check if disabled in config
  if (!config.auth.trialCheckEnabled) {
    return {
      isTrial: false,
      subscriptionStatus: 'active',
      isExpired: false
    };
  }

  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/user/trial-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Request': 'middleware'
      },
      body: JSON.stringify({ userId })
    });

    if (!response.ok) {
      return {
        isTrial: false,
        subscriptionStatus: 'unknown',
        isExpired: false
      }
    }

    const data = await response.json();
    return {
      isTrial: data.isTrial || false,
      subscriptionStatus: data.subscriptionStatus || 'trial',
      isExpired: data.isExpired || false
    }
    
  } catch (error) {
    console.error('Error getting user subscription status:', error)
    return {
      isTrial: false,
      subscriptionStatus: 'unknown',
      isExpired: false
    }
  }
} 