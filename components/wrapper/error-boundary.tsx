'use client'

import React, { Component, type ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, RotateCcw, Crown, ArrowLeft, Bug, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: string | null
  errorId: string | null
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  showDetails?: boolean
  resetOnPropsChange?: boolean
  resetKeys?: Array<string | number>
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo: errorInfo.componentStack || null
    })

    // Call the optional error callback
    this.props.onError?.(error, errorInfo)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo)
    }

    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo)
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys } = this.props
    const { hasError } = this.state

    if (hasError && prevProps.resetKeys !== resetKeys) {
      const hasResetKeyChanged = resetKeys?.some((key, index) => 
        key !== prevProps.resetKeys?.[index]
      )

      if (hasResetKeyChanged) {
        this.resetErrorBoundary()
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId)
    }
  }

  private reportError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Integration point for error reporting services like Sentry
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } })
    
    console.error('Production Error Report:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    })
  }

  private categorizeError = (error: Error): string => {
    const message = error.message.toLowerCase()
    
    if (message.includes('subscription') || message.includes('payment') || message.includes('billing')) {
      return 'subscription'
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
    
    return 'unknown'
  }

  private getErrorSuggestion = (category: string): string => {
    switch (category) {
      case 'subscription':
        return "This might be related to your subscription status or billing information."
      case 'network':
        return "Please check your internet connection and try again."
      case 'authentication':
        return "You may need to sign in again or check your account permissions."
      case 'validation':
        return "Please check your input and try again."
      case 'database':
        return "We're experiencing technical difficulties. Please try again later."
      default:
        return "An unexpected error occurred. Our team has been notified."
    }
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    })
  }

  handleReset = () => {
    this.resetErrorBoundary()
  }

  handleReload = () => {
    window.location.reload()
  }

  handleRetryWithDelay = () => {
    this.resetTimeoutId = window.setTimeout(() => {
      this.resetErrorBoundary()
    }, 1000)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const errorCategory = this.categorizeError(this.state.error)
      const errorSuggestion = this.getErrorSuggestion(errorCategory)
      const isSubscriptionError = errorCategory === 'subscription'
      const isNetworkError = errorCategory === 'network'
      const isDevelopment = process.env.NODE_ENV === 'development'

      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
              <CardDescription>
                {errorSuggestion}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error ID for support */}
              {this.state.errorId && (
                <div className="p-2 bg-muted rounded text-xs text-center">
                  <span className="text-muted-foreground">Error ID: </span>
                  <span className="font-mono">{this.state.errorId}</span>
                </div>
              )}

              {/* Error details in development */}
              {isDevelopment && this.state.error && this.props.showDetails !== false && (
                <div className="p-3 bg-muted rounded-lg text-xs space-y-2">
                  <div>
                    <p className="font-medium mb-1">Error:</p>
                    <p className="text-muted-foreground break-all">{this.state.error.message}</p>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <p className="font-medium mb-1">Component Stack:</p>
                      <pre className="text-muted-foreground text-xs overflow-auto max-h-32 whitespace-pre-wrap">
                        {this.state.errorInfo}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Category-specific badges */}
              <div className="flex justify-center">
                <Badge variant={errorCategory === 'subscription' ? 'destructive' : 'secondary'}>
                  {errorCategory.charAt(0).toUpperCase() + errorCategory.slice(1)} Error
                </Badge>
              </div>

              {/* Subscription-specific actions */}
              {isSubscriptionError && (
                <div className="space-y-2">
                  <Button asChild variant="default" className="w-full">
                    <Link href="/dashboard/settings">
                      <Crown className="h-4 w-4 mr-2" />
                      Check Subscription
                    </Link>
                  </Button>
                  <Badge variant="secondary" className="w-full justify-center py-1">
                    This might be related to your current plan limits
                  </Badge>
                </div>
              )}

              {/* Recovery actions */}
              <div className="flex gap-2">
                <Button 
                  onClick={this.handleReset} 
                  variant="outline"
                  className="flex-1"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                {isNetworkError ? (
                  <Button 
                    onClick={this.handleRetryWithDelay}
                    variant="outline"
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                ) : (
                  <Button 
                    onClick={this.handleReload}
                    variant="outline"
                    className="flex-1"
                  >
                    Reload Page
                  </Button>
                )}
              </div>

              {/* Navigation options */}
              <div className="pt-2 border-t space-y-2">
                <Button asChild variant="ghost" className="w-full">
                  <Link href="/dashboard">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Link>
                </Button>
                
                {/* Support link in production */}
                {!isDevelopment && (
                  <Button asChild variant="ghost" className="w-full">
                    <Link href="/support" target="_blank">
                      <Bug className="h-4 w-4 mr-2" />
                      Contact Support
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook version for functional components
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return {
    captureError,
    resetError
  }
}

// Wrapper component for easy usage
export function WithErrorBoundary({ 
  children, 
  fallback,
  onError,
  showDetails,
  resetKeys
}: ErrorBoundaryProps) {
  return (
    <ErrorBoundary 
      fallback={fallback} 
      onError={onError}
      showDetails={showDetails}
      resetKeys={resetKeys}
    >
      {children}
    </ErrorBoundary>
  )
}

// Specialized error boundaries for different contexts
export function DashboardErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Dashboard Error:', error, errorInfo)
        // Could send to analytics with dashboard context
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

export function PaymentErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Payment Error:', error, errorInfo)
        // Could send to analytics with payment context
      }}
    >
      {children}
    </ErrorBoundary>
  )
} 