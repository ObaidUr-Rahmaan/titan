import { logUserActivity, ACTIVITY_TYPES, ACTIVITY_CATEGORIES } from '@/utils/actions/shared/activity-logger'

export interface ErrorContext {
  userId?: string
  component?: string
  action?: string
  metadata?: Record<string, any>
  userAgent?: string
  url?: string
}

export interface ErrorReport {
  id: string
  timestamp: string
  error: {
    name: string
    message: string
    stack?: string
  }
  context: ErrorContext
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: string
}

/**
 * Global error handler for the application
 */
export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler
  private errorReports: ErrorReport[] = []
  private maxReports = 100

  private constructor() {}

  public static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler()
    }
    return GlobalErrorHandler.instance
  }

  /**
   * Handle and report an error
   */
  async handleError(error: Error, context: ErrorContext = {}): Promise<string> {
    const errorId = this.generateErrorId()
    const severity = this.determineSeverity(error, context)
    const category = this.categorizeError(error)

    const errorReport: ErrorReport = {
      id: errorId,
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context,
      severity,
      category
    }

    // Store locally for debugging
    this.storeErrorReport(errorReport)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Global Error Handler:', errorReport)
    }

    // Log to activity system if user is available
    if (context.userId) {
      await this.logErrorActivity(errorReport)
    }

    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      await this.reportToExternalService(errorReport)
    }

    return errorId
  }

  /**
   * Handle async errors (Promise rejections)
   */
  async handleAsyncError(error: Error, context: ErrorContext = {}): Promise<string> {
    return this.handleError(error, { ...context, action: 'async_operation' })
  }

  /**
   * Handle React component errors
   */
  async handleComponentError(error: Error, componentName: string, context: ErrorContext = {}): Promise<string> {
    return this.handleError(error, { 
      ...context, 
      component: componentName,
      action: 'component_render' 
    })
  }

  /**
   * Handle API errors
   */
  async handleApiError(error: Error, endpoint: string, context: ErrorContext = {}): Promise<string> {
    return this.handleError(error, { 
      ...context, 
      action: 'api_call',
      metadata: { 
        ...context.metadata, 
        endpoint 
      }
    })
  }

  /**
   * Handle authentication errors
   */
  async handleAuthError(error: Error, context: ErrorContext = {}): Promise<string> {
    return this.handleError(error, { 
      ...context, 
      action: 'authentication',
      metadata: { 
        ...context.metadata, 
        errorType: 'auth' 
      }
    })
  }

  /**
   * Handle billing/payment errors
   */
  async handleBillingError(error: Error, context: ErrorContext = {}): Promise<string> {
    return this.handleError(error, { 
      ...context, 
      action: 'billing_operation',
      metadata: { 
        ...context.metadata, 
        errorType: 'billing' 
      }
    })
  }

  /**
   * Get recent error reports
   */
  getRecentErrors(limit: number = 10): ErrorReport[] {
    return this.errorReports
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number
    bySeverity: Record<string, number>
    byCategory: Record<string, number>
    recent24h: number
  } {
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const bySeverity: Record<string, number> = {}
    const byCategory: Record<string, number> = {}
    let recent24h = 0

    this.errorReports.forEach(report => {
      bySeverity[report.severity] = (bySeverity[report.severity] || 0) + 1
      byCategory[report.category] = (byCategory[report.category] || 0) + 1
      
      if (new Date(report.timestamp) > yesterday) {
        recent24h++
      }
    })

    return {
      total: this.errorReports.length,
      bySeverity,
      byCategory,
      recent24h
    }
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private determineSeverity(error: Error, context: ErrorContext): 'low' | 'medium' | 'high' | 'critical' {
    const message = error.message.toLowerCase()
    
    // Critical errors
    if (message.includes('payment') || message.includes('billing') || message.includes('subscription')) {
      return 'critical'
    }
    
    if (message.includes('database') || message.includes('sql') || message.includes('connection')) {
      return 'critical'
    }

    if (message.includes('auth') || message.includes('unauthorized') || message.includes('forbidden')) {
      return 'high'
    }

    // High severity errors
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return 'high'
    }

    // Medium severity errors
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return 'medium'
    }

    if (message.includes('validation') || message.includes('invalid')) {
      return 'medium'
    }

    // Default to low
    return 'low'
  }

  private categorizeError(error: Error): string {
    const message = error.message.toLowerCase()
    
    if (message.includes('subscription') || message.includes('payment') || message.includes('billing')) {
      return 'billing'
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'network'
    }
    if (message.includes('auth') || message.includes('unauthorized')) {
      return 'authentication'
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation'
    }
    if (message.includes('database') || message.includes('sql')) {
      return 'database'
    }
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return 'javascript'
    }
    
    return 'unknown'
  }

  private storeErrorReport(report: ErrorReport): void {
    this.errorReports.push(report)
    
    // Keep only the most recent reports
    if (this.errorReports.length > this.maxReports) {
      this.errorReports = this.errorReports.slice(-this.maxReports)
    }
  }

  private async logErrorActivity(report: ErrorReport): Promise<void> {
    if (!report.context.userId) return

    try {
      await logUserActivity({
        userId: report.context.userId,
        activityType: ACTIVITY_TYPES.SYSTEM_ERROR,
        category: ACTIVITY_CATEGORIES.SYSTEM,
        title: `Error: ${report.error.name}`,
        description: report.error.message,
        metadata: {
          errorId: report.id,
          severity: report.severity,
          category: report.category,
          component: report.context.component,
          action: report.context.action,
          stack: report.error.stack?.substring(0, 1000), // Truncate stack trace
          userAgent: report.context.userAgent,
          url: report.context.url,
          timestamp: report.timestamp
        },
        source: 'web'
      })
    } catch (error) {
      console.error('Failed to log error activity:', error)
    }
  }

  private async reportToExternalService(report: ErrorReport): Promise<void> {
    try {
      // Integration point for services like Sentry, LogRocket, etc.
      // Example: Sentry.captureException(new Error(report.error.message), { 
      //   contexts: { errorReport: report } 
      // })
      
      console.log('📊 Error Report (Production):', {
        id: report.id,
        severity: report.severity,
        category: report.category,
        message: report.error.message,
        timestamp: report.timestamp
      })
    } catch (error) {
      console.error('Failed to report to external service:', error)
    }
  }
}

// Global instance
export const globalErrorHandler = GlobalErrorHandler.getInstance()

// Convenience functions
export const handleError = (error: Error, context?: ErrorContext) => 
  globalErrorHandler.handleError(error, context)

export const handleAsyncError = (error: Error, context?: ErrorContext) => 
  globalErrorHandler.handleAsyncError(error, context)

export const handleComponentError = (error: Error, componentName: string, context?: ErrorContext) => 
  globalErrorHandler.handleComponentError(error, componentName, context)

export const handleApiError = (error: Error, endpoint: string, context?: ErrorContext) => 
  globalErrorHandler.handleApiError(error, endpoint, context)

export const handleAuthError = (error: Error, context?: ErrorContext) => 
  globalErrorHandler.handleAuthError(error, context)

export const handleBillingError = (error: Error, context?: ErrorContext) => 
  globalErrorHandler.handleBillingError(error, context)

// Error boundary integration
export const withErrorHandling = <T extends (...args: any[]) => any>(
  fn: T,
  context?: ErrorContext
): T => {
  return ((...args: any[]) => {
    try {
      const result = fn(...args)
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error: Error) => {
          handleAsyncError(error, context)
          throw error
        })
      }
      
      return result
    } catch (error) {
      handleError(error as Error, context)
      throw error
    }
  }) as T
}

// Global error listeners
if (typeof window !== 'undefined') {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    handleAsyncError(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      {
        action: 'unhandled_promise_rejection',
        url: window.location.href,
        userAgent: navigator.userAgent
      }
    )
  })

  // Handle global JavaScript errors
  window.addEventListener('error', (event) => {
    handleError(event.error || new Error(event.message), {
      action: 'global_javascript_error',
      url: window.location.href,
      userAgent: navigator.userAgent,
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    })
  })
} 