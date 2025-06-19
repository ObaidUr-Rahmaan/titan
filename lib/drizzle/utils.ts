import { createDirectClient } from './index'
import { sql } from 'drizzle-orm'
import { users } from '../../db/schema'

/**
 * Database utility functions for common operations
 */

// Type for standardized action results
export interface DatabaseResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Get user by Clerk user ID
 */
export async function getUserByClerkId(clerkUserId: string): Promise<DatabaseResult> {
  try {
    const db = createDirectClient()
    const user = await db.select().from(users).where(sql`user_id = ${clerkUserId}`)
    
    if (user.length === 0) {
      return { success: false, error: 'User not found' }
    }
    
    return { success: true, data: user[0] }
  } catch (error: any) {
    console.error('Error fetching user by Clerk ID:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Check if user exists by Clerk user ID
 */
export async function userExists(clerkUserId: string): Promise<boolean> {
  try {
    const db = createDirectClient()
    const result = await db.execute(sql`
      SELECT 1 FROM "user" WHERE user_id = ${clerkUserId} LIMIT 1
    `)
    return result.length > 0
  } catch (error) {
    console.error('Error checking user existence:', error)
    return false
  }
}

/**
 * Get database connection health
 */
export async function checkDatabaseHealth(): Promise<DatabaseResult> {
  try {
    const db = createDirectClient()
    const result = await db.execute(sql`SELECT 1 as health`)
    
    return { 
      success: true, 
      data: { 
        status: 'healthy',
        timestamp: new Date().toISOString()
      }
    }
  } catch (error: any) {
    console.error('Database health check failed:', error)
    return { 
      success: false, 
      error: error.message,
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      }
    }
  }
}

/**
 * Get table row counts for monitoring
 */
export async function getTableStats(): Promise<DatabaseResult> {
  try {
    const db = createDirectClient()
    
    const tables = ['user', 'payments', 'subscriptions', 'invoices', 'refunds']
    const stats: Record<string, number> = {}
    
    for (const table of tables) {
      const result = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM "${table}"`))
      stats[table] = Number((result[0] as any).count)
    }
    
    return { success: true, data: stats }
  } catch (error: any) {
    console.error('Error getting table stats:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Clean up test data (development only)
 */
export async function cleanupTestData(): Promise<DatabaseResult> {
  if (process.env.NODE_ENV === 'production') {
    return { success: false, error: 'Cannot run cleanup in production' }
  }
  
  try {
    const db = createDirectClient()
    
    // Delete test users (those with email containing 'test' or 'example')
    await db.execute(sql`
      DELETE FROM "user" 
      WHERE email LIKE '%test%' 
      OR email LIKE '%example%'
      OR email LIKE '%@test.com'
    `)
    
    return { success: true, data: { message: 'Test data cleaned up' } }
  } catch (error: any) {
    console.error('Error cleaning up test data:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Execute raw SQL with error handling
 */
export async function executeRawSQL(query: string): Promise<DatabaseResult> {
  try {
    const db = createDirectClient()
    const result = await db.execute(sql.raw(query))
    
    return { success: true, data: result }
  } catch (error: any) {
    console.error('Error executing raw SQL:', error)
    return { success: false, error: error.message }
  }
} 