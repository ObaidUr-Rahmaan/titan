'use server'

import { createServerActionClient } from '@/lib/supabase'
import { eq, and, desc, sql } from 'drizzle-orm'

interface ActivityLogData {
  userId: string
  activityType: string
  category?: string
  title: string
  description?: string
  metadata?: Record<string, any>
  source?: 'web' | 'api' | 'webhook' | 'admin' | 'cron'
  relatedEntityType?: string
  relatedEntityId?: string
  ipAddress?: string
  userAgent?: string
}

interface ActivityQueryOptions {
  category?: string
  activityType?: string
  limit?: number
  offset?: number
  startDate?: Date
  endDate?: Date
}

/**
 * Log user activity to the database
 */
export async function logUserActivity(data: ActivityLogData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerActionClient()
    
    const activityData = {
      user_id: data.userId,
      activity_type: data.activityType,
      category: data.category || 'general',
      title: data.title,
      description: data.description || null,
      metadata: data.metadata || {},
      source: data.source || 'web',
      related_entity_type: data.relatedEntityType || null,
      related_entity_id: data.relatedEntityId || null,
      ip_address: data.ipAddress || null,
      user_agent: data.userAgent || null,
      created_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('user_activity')
      .insert(activityData)

    if (error) {
      console.error('❌ ACTIVITY LOG: Database error:', error)
      return {
        success: false,
        error: error.message
      }
    }

    console.log(`✅ ACTIVITY LOG: Logged activity for user ${data.userId}:`, {
      activityType: data.activityType,
      title: data.title,
      timestamp: new Date().toISOString()
    })

    return { success: true }
  } catch (error) {
    console.error('❌ ACTIVITY LOG: Failed to log activity:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get user activity history
 */
export async function getUserActivityHistory(
  userId: string, 
  options: ActivityQueryOptions = {}
): Promise<{ 
  success: boolean; 
  activities?: any[]; 
  total?: number; 
  error?: string 
}> {
  try {
    const supabase = await createServerActionClient()
    
    let query = supabase
      .from('user_activity')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // Apply filters
    if (options.category) {
      query = query.eq('category', options.category)
    }
    
    if (options.activityType) {
      query = query.eq('activity_type', options.activityType)
    }

    if (options.startDate) {
      query = query.gte('created_at', options.startDate.toISOString())
    }

    if (options.endDate) {
      query = query.lte('created_at', options.endDate.toISOString())
    }

    // Apply pagination
    if (options.offset) {
      query = query.range(options.offset, (options.offset + (options.limit || 50)) - 1)
    } else if (options.limit) {
      query = query.limit(options.limit)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('❌ ACTIVITY LOG: Failed to fetch activities:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      activities: data || [],
      total: count || 0
    }
  } catch (error) {
    console.error('❌ ACTIVITY LOG: Failed to fetch activities:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get activity statistics for a user
 */
export async function getUserActivityStats(
  userId: string, 
  days: number = 30
): Promise<{ 
  success: boolean; 
  stats?: Record<string, number>; 
  error?: string 
}> {
  try {
    const supabase = await createServerActionClient()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('user_activity')
      .select('category, activity_type')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())

    if (error) {
      console.error('❌ ACTIVITY LOG: Failed to fetch activity stats:', error)
      return {
        success: false,
        error: error.message
      }
    }

    // Process statistics
    const stats: Record<string, number> = {}
    
    data?.forEach(activity => {
      const category = activity.category || 'general'
      const type = activity.activity_type
      
      stats[category] = (stats[category] || 0) + 1
      stats[`${category}_${type}`] = (stats[`${category}_${type}`] || 0) + 1
    })

    return {
      success: true,
      stats
    }
  } catch (error) {
    console.error('❌ ACTIVITY LOG: Failed to fetch activity stats:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Clean up old activity logs (for maintenance)
 */
export async function cleanupOldActivities(
  retentionDays: number = 365
): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
  try {
    const supabase = await createServerActionClient()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

    const { error, count } = await supabase
      .from('user_activity')
      .delete()
      .lt('created_at', cutoffDate.toISOString())

    if (error) {
      console.error('❌ ACTIVITY LOG: Failed to cleanup old activities:', error)
      return {
        success: false,
        error: error.message
      }
    }

    console.log(`✅ ACTIVITY LOG: Cleaned up ${count || 0} old activity records`)

    return {
      success: true,
      deletedCount: count || 0
    }
  } catch (error) {
    console.error('❌ ACTIVITY LOG: Failed to cleanup old activities:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Activity type constants
export const ACTIVITY_TYPES = {
  // Authentication
  USER_SIGNED_IN: 'auth_user_signed_in',
  USER_SIGNED_OUT: 'auth_user_signed_out',
  USER_REGISTERED: 'auth_user_registered',
  PASSWORD_CHANGED: 'auth_password_changed',
  
  // Profile
  PROFILE_UPDATED: 'profile_updated',
  PROFILE_PICTURE_CHANGED: 'profile_picture_changed',
  
  // Settings
  SETTINGS_UPDATED: 'settings_updated',
  PREFERENCES_CHANGED: 'preferences_changed',
  
  // Billing (basic - extended in billing-activity-logger)
  BILLING_ACTION: 'billing_action',
  
  // System
  SYSTEM_ERROR: 'system_error',
  SYSTEM_WARNING: 'system_warning',
  
  // API
  API_REQUEST: 'api_request',
  API_ERROR: 'api_error',
  
  // Security
  SECURITY_EVENT: 'security_event',
  SUSPICIOUS_ACTIVITY: 'security_suspicious_activity',
} as const

export type ActivityType = typeof ACTIVITY_TYPES[keyof typeof ACTIVITY_TYPES]

// Category constants
export const ACTIVITY_CATEGORIES = {
  AUTHENTICATION: 'authentication',
  BILLING: 'billing',
  PROFILE: 'profile',
  SETTINGS: 'settings',
  SYSTEM: 'system',
  API: 'api',
  SECURITY: 'security',
  GENERAL: 'general'
} as const

export type ActivityCategory = typeof ACTIVITY_CATEGORIES[keyof typeof ACTIVITY_CATEGORIES] 