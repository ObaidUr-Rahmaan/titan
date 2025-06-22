'use client'

interface ErrorContext {
  component?: string
  action?: string
  url?: string
  metadata?: Record<string, any>
}

interface ErrorReport {
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
 * Client-side error reporter that sends errors to the API
 */
export class ClientErrorReporter {
  private static instance: ClientErrorReporter
  private reportQueue: ErrorReport[] = []
  private isProcessing = false
  private maxRetries = 3
  private retryDelay = 1000

  private constructor() {
    // Set up global error handlers
    this.setupGlobalHandlers()
  }

  public static getInstance(): ClientErrorReporter {
    if (!ClientErrorReporter.instance) {
      ClientErrorReporter.instance = new ClientErrorReporter()
    }
    return ClientErrorReporter.instance
  }

  /**
   * Set up global error handlers for unhandled errors
   */
  private setupGlobalHandlers() {
    if (typeof window === 'undefined') return

    // Handle unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.reportError(event.error || new Error(event.message), {
        component: 'global',
        action: 'unhandled_error',
        url: window.location.href,
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      }, 'high', 'javascript')
    })

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason))
      
      this.reportError(error, {
        component: 'global',
        action: 'unhandled_promise_rejection',
        url: window.location.href
      }, 'high', 'promise')
    })

    // Handle React error boundary errors (if not caught)
    const originalConsoleError = console.error
    console.error = (...args) => {
      // Check if this looks like a React error
      const message = args.join(' ')
      if (message.includes('React') || message.includes('component')) {
        const error = new Error(message)
        this.reportError(error, {
          component: 'react',
          action: 'console_error',
          url: window.location.href,
          metadata: { args }
        }, 'medium', 'react')
      }
      
      // Call original console.error
      originalConsoleError.apply(console, args)
    }
  }

  /**
   * Report an error to the API
   */
  public async reportError(
    error: Error,
    context: ErrorContext = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    category: string = 'general'
  ): Promise<void> {
    const report: ErrorReport = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context: {
        ...context,
        url: context.url || (typeof window !== 'undefined' ? window.location.href : undefined)
      },
      severity,
      category
    }

    // Add to queue
    this.reportQueue.push(report)

    // Process queue if not already processing
    if (!this.isProcessing) {
      await this.processQueue()
    }
  }

  /**
   * Process the error report queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.reportQueue.length === 0) return

    this.isProcessing = true

    while (this.reportQueue.length > 0) {
      const report = this.reportQueue.shift()!
      
      try {
        await this.sendReport(report)
      } catch (error) {
        console.error('Failed to send error report:', error)
        // Could implement retry logic here
      }
    }

    this.isProcessing = false
  }

  /**
   * Send a single error report to the API
   */
  private async sendReport(report: ErrorReport, retryCount = 0): Promise<void> {
    try {
      const response = await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(report)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error')
      }

      // Success - log for debugging
      console.debug('Error report sent successfully:', result.errorId)

    } catch (error) {
      console.error('Failed to send error report:', error)
      
      // Retry logic
      if (retryCount < this.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retryCount + 1)))
        return this.sendReport(report, retryCount + 1)
      }
      
      throw error
    }
  }

  /**
   * Report a custom error with context
   */
  public reportCustomError(
    message: string,
    context: ErrorContext = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    category: string = 'custom'
  ): void {
    const error = new Error(message)
    error.name = 'CustomError'
    this.reportError(error, context, severity, category)
  }

  /**
   * Report an API error
   */
  public reportApiError(
    endpoint: string,
    method: string,
    status: number,
    message: string,
    context: ErrorContext = {}
  ): void {
    const error = new Error(`API Error: ${method.toUpperCase()} ${endpoint} - ${status} ${message}`)
    error.name = 'ApiError'
    
    this.reportError(error, {
      ...context,
      component: 'api',
      action: `${method.toLowerCase()}_request`,
      metadata: {
        endpoint,
        method,
        status,
        ...context.metadata
      }
    }, status >= 500 ? 'high' : 'medium', 'api')
  }

  /**
   * Report a validation error
   */
  public reportValidationError(
    field: string,
    value: any,
    rule: string,
    context: ErrorContext = {}
  ): void {
    const error = new Error(`Validation Error: ${field} failed ${rule} validation`)
    error.name = 'ValidationError'
    
    this.reportError(error, {
      ...context,
      component: 'validation',
      action: 'field_validation',
      metadata: {
        field,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value),
        rule,
        ...context.metadata
      }
    }, 'low', 'validation')
  }

  /**
   * Report a performance issue
   */
  public reportPerformanceIssue(
    metric: string,
    value: number,
    threshold: number,
    context: ErrorContext = {}
  ): void {
    const error = new Error(`Performance Issue: ${metric} (${value}) exceeded threshold (${threshold})`)
    error.name = 'PerformanceError'
    
    this.reportError(error, {
      ...context,
      component: 'performance',
      action: 'threshold_exceeded',
      metadata: {
        metric,
        value,
        threshold,
        ...context.metadata
      }
    }, 'medium', 'performance')
  }
}

// Export singleton instance
export const errorReporter = ClientErrorReporter.getInstance()

// Convenience functions
export const reportError = (error: Error, context?: ErrorContext, severity?: 'low' | 'medium' | 'high' | 'critical', category?: string) => {
  errorReporter.reportError(error, context, severity, category)
}

export const reportCustomError = (message: string, context?: ErrorContext, severity?: 'low' | 'medium' | 'high' | 'critical', category?: string) => {
  errorReporter.reportCustomError(message, context, severity, category)
}

export const reportApiError = (endpoint: string, method: string, status: number, message: string, context?: ErrorContext) => {
  errorReporter.reportApiError(endpoint, method, status, message, context)
}

export const reportValidationError = (field: string, value: any, rule: string, context?: ErrorContext) => {
  errorReporter.reportValidationError(field, value, rule, context)
}

export const reportPerformanceIssue = (metric: string, value: number, threshold: number, context?: ErrorContext) => {
  errorReporter.reportPerformanceIssue(metric, value, threshold, context)
} 