import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getClientIdentifier } from '@/lib/ratelimit'

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
  // Prevent XSS attacks
  'X-XSS-Protection': '1; mode=block',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Force HTTPS in production
  'Strict-Transport-Security': process.env.NODE_ENV === 'production' 
    ? 'max-age=31536000; includeSubDomains; preload'
    : '',
    
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.stripe.com https://checkout.stripe.com https://vitals.vercel-insights.com wss:",
    "frame-src 'self' https://js.stripe.com https://checkout.stripe.com",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; '),
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions policy
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()'
  ].join(', ')
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    if (value) {
      response.headers.set(key, value)
    }
  })
  
  return response
}

/**
 * CSRF token generation and validation
 */
export class CSRFProtection {
  private static readonly TOKEN_LENGTH = 32
  private static readonly HEADER_NAME = 'X-CSRF-Token'
  private static readonly COOKIE_NAME = 'csrf-token'
  
  /**
   * Generate a cryptographically secure CSRF token
   */
  static generateToken(): string {
    const array = new Uint8Array(this.TOKEN_LENGTH)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }
  
  /**
   * Validate CSRF token from request
   */
  static async validateToken(request: NextRequest): Promise<boolean> {
    try {
      // Skip CSRF validation for safe methods
      if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
        return true
      }
      
      // Get token from header
      const headerToken = request.headers.get(this.HEADER_NAME)
      
      // Get token from cookie
      const cookieToken = request.cookies.get(this.COOKIE_NAME)?.value
      
      // Both tokens must exist and match
      if (!headerToken || !cookieToken) {
        return false
      }
      
      return headerToken === cookieToken
    } catch (error) {
      console.error('CSRF validation error:', error)
      return false
    }
  }
  
  /**
   * Set CSRF token in response cookie
   */
  static setTokenCookie(response: NextResponse, token: string): void {
    response.cookies.set(this.COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    })
  }
}

/**
 * XSS Protection utilities
 */
export class XSSProtection {
  /**
   * Sanitize HTML content to prevent XSS
   */
  static sanitizeHtml(html: string): string {
    // Basic HTML sanitization - replace dangerous characters
    return html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }
  
  /**
   * Validate and sanitize user input
   */
  static sanitizeInput(input: string): string {
    if (typeof input !== 'string') {
      return ''
    }
    
    // Remove null bytes and control characters
    return input
      .replace(/\0/g, '')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .trim()
  }
  
  /**
   * Check for potential XSS patterns
   */
  static detectXSS(input: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      /<embed\b[^>]*>/gi,
      /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi
    ]
    
    return xssPatterns.some(pattern => pattern.test(input))
  }
}

/**
 * Rate limiting based on IP and user ID
 */
export class SecurityRateLimit {
  private static attempts = new Map<string, { count: number; resetTime: number }>()
  
  /**
   * Check if request should be rate limited
   */
  static checkRateLimit(
    identifier: string, 
    maxAttempts: number = 5, 
    windowMs: number = 15 * 60 * 1000 // 15 minutes
  ): { allowed: boolean; remainingAttempts: number; resetTime: number } {
    const now = Date.now()
    const key = `rate_limit:${identifier}`
    const current = this.attempts.get(key)
    
    // Reset if window has expired
    if (!current || now > current.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + windowMs })
      return { allowed: true, remainingAttempts: maxAttempts - 1, resetTime: now + windowMs }
    }
    
    // Increment attempts
    current.count++
    this.attempts.set(key, current)
    
    const remainingAttempts = Math.max(0, maxAttempts - current.count)
    const allowed = current.count <= maxAttempts
    
    return { allowed, remainingAttempts, resetTime: current.resetTime }
  }
  
  /**
   * Clear rate limit for identifier
   */
  static clearRateLimit(identifier: string): void {
    const key = `rate_limit:${identifier}`
    this.attempts.delete(key)
  }
}

/**
 * Input validation and sanitization middleware
 */
export class InputValidator {
  /**
   * Validate request body size
   */
  static validateBodySize(request: NextRequest, maxSize: number = 1024 * 1024): boolean {
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > maxSize) {
      return false
    }
    return true
  }
  
  /**
   * Validate content type
   */
  static validateContentType(request: NextRequest, allowedTypes: string[]): boolean {
    const contentType = request.headers.get('content-type')
    if (!contentType) {
      return false
    }
    
    return allowedTypes.some(type => contentType.includes(type))
  }
  
  /**
   * Validate request origin
   */
  static validateOrigin(request: NextRequest, allowedOrigins: string[]): boolean {
    const origin = request.headers.get('origin')
    const referer = request.headers.get('referer')
    
    // Allow same-origin requests
    if (!origin && !referer) {
      return true
    }
    
    const requestOrigin = origin || (referer ? new URL(referer).origin : null)
    if (!requestOrigin) {
      return false
    }
    
    return allowedOrigins.includes(requestOrigin)
  }
}

/**
 * Security middleware factory
 */
export function createSecurityMiddleware(options: {
  enableCSRF?: boolean
  enableRateLimit?: boolean
  maxRequestSize?: number
  allowedOrigins?: string[]
  customHeaders?: Record<string, string>
} = {}) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    try {
      // Validate request size
      if (!InputValidator.validateBodySize(request, options.maxRequestSize)) {
        return new NextResponse('Request entity too large', { status: 413 })
      }
      
      // Validate origin for non-GET requests
      if (options.allowedOrigins && !['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
        if (!InputValidator.validateOrigin(request, options.allowedOrigins)) {
          return new NextResponse('Invalid origin', { status: 403 })
        }
      }
      
      // CSRF protection
      if (options.enableCSRF) {
        const isValidCSRF = await CSRFProtection.validateToken(request)
        if (!isValidCSRF) {
          return new NextResponse('CSRF token invalid', { status: 403 })
        }
      }
      
      // Rate limiting
      if (options.enableRateLimit) {
        const clientId = getClientIdentifier(request)
        const rateLimit = SecurityRateLimit.checkRateLimit(clientId)
        
        if (!rateLimit.allowed) {
          const response = new NextResponse('Too many requests', { status: 429 })
          response.headers.set('Retry-After', Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString())
          return response
        }
      }
      
      return null // Continue to next middleware
    } catch (error) {
      console.error('Security middleware error:', error)
      return new NextResponse('Security validation failed', { status: 500 })
    }
  }
}

/**
 * Comprehensive security utilities
 */
export const SecurityUtils = {
  CSRFProtection,
  XSSProtection,
  SecurityRateLimit,
  InputValidator,
  applySecurityHeaders,
  createSecurityMiddleware,
  SECURITY_HEADERS
} 