import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { logBillingActivity } from '@/utils/billing-activity-logger'
import { headers } from 'next/headers'

interface ErrorReportPayload {
  error: {
    name: string
    message: string
    stack?: string
  }
  context: {
    component?: string
    action?: string
    url?: string
    metadata?: Record<string, any>
  }
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: string
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const payload: ErrorReportPayload = await request.json()
    
    // Validate payload
    if (!payload.error?.name || !payload.error?.message) {
      return NextResponse.json(
        { error: 'Invalid error report payload' },
        { status: 400 }
      )
    }

    // Get request headers for additional context
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || undefined
    const referer = headersList.get('referer') || undefined

    // Create activity log entry for the error
    const activityResult = await logBillingActivity({
      userId,
      activityType: 'system_error',
      title: `Error: ${payload.error.name}`,
      description: payload.error.message,
      metadata: {
        error: {
          name: payload.error.name,
          message: payload.error.message,
          stack: payload.error.stack
        },
        context: payload.context,
        severity: payload.severity,
        category: payload.category,
        userAgent,
        referer,
        timestamp: new Date().toISOString()
      },
      source: 'web',
      relatedEntityType: 'error_report',
      relatedEntityId: `${payload.error.name}_${Date.now()}`
    })

    if (!activityResult.success) {
      console.error('Failed to log error activity:', activityResult.error)
      // Don't fail the error report if logging fails
    }

    // Generate error report ID
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Log to console for development/debugging
    console.error('Error Report:', {
      errorId,
      userId,
      error: payload.error,
      context: payload.context,
      severity: payload.severity,
      category: payload.category,
      timestamp: new Date().toISOString()
    })

    // In production, you might want to send this to an external service
    // like Sentry, LogRocket, or your own error tracking system
    
    return NextResponse.json({
      success: true,
      errorId,
      message: 'Error report received successfully'
    })

  } catch (error) {
    console.error('Error in error reporting endpoint:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to process error report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve error reports for the current user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const severity = searchParams.get('severity') as 'low' | 'medium' | 'high' | 'critical' | null
    const category = searchParams.get('category')

    // This would typically fetch from your activity log
    // For now, return a placeholder response
    const errorReports = {
      reports: [],
      total: 0,
      filters: {
        severity,
        category,
        limit
      }
    }

    return NextResponse.json({
      success: true,
      data: errorReports
    })

  } catch (error) {
    console.error('Error fetching error reports:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch error reports',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 