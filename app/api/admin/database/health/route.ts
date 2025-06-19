import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { checkDatabaseHealth, getTableStats } from '@/lib/drizzle/utils'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // For now, we'll allow any authenticated user
    // In production, you'd want to check for admin role
    
    // Get database health
    const healthResult = await checkDatabaseHealth()
    if (!healthResult.success) {
      return NextResponse.json(
        { 
          error: 'Database health check failed',
          details: healthResult.error 
        },
        { status: 500 }
      )
    }

    // Get table statistics
    const statsResult = await getTableStats()
    if (!statsResult.success) {
      return NextResponse.json(
        { 
          error: 'Failed to get table statistics',
          details: statsResult.error 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      health: healthResult.data,
      statistics: statsResult.data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Database health check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 