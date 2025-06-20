import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { z } from 'zod'
import { applyRateLimit } from '@/lib/ratelimit'
import { XSSProtection, InputValidator } from '@/utils/middleware/security'

export interface ValidationOptions {
  requireAuth?: boolean
  rateLimitKey?: "api" | "auth" | "payment" | "strict" | "public"
  maxBodySize?: number
  allowedMethods?: string[]
  allowedContentTypes?: string[]
  enableXSSCheck?: boolean
}

export interface ValidationResult<T = any> {
  success: boolean
  data?: T
  error?: string
  details?: any
  response?: NextResponse
}

/**
 * Comprehensive API route validation utility
 */
export class APIValidator {
  /**
   * Validate and parse request with comprehensive security checks
   */
  static async validateRequest<T>(
    request: NextRequest,
    schema?: z.ZodSchema<T>,
    options: ValidationOptions = {}
  ): Promise<ValidationResult<T>> {
    try {
      // Force headers evaluation for Clerk v6+
      await headers()

      // Method validation
      if (options.allowedMethods && !options.allowedMethods.includes(request.method)) {
        return {
          success: false,
          error: 'Method not allowed',
          response: new NextResponse('Method not allowed', { status: 405 })
        }
      }

      // Content type validation
      if (options.allowedContentTypes && request.method !== 'GET') {
        const contentType = request.headers.get('content-type')
        if (contentType && !options.allowedContentTypes.some(type => contentType.includes(type))) {
          return {
            success: false,
            error: 'Invalid content type',
            response: new NextResponse('Invalid content type', { status: 415 })
          }
        }
      }

      // Body size validation
      if (!InputValidator.validateBodySize(request, options.maxBodySize)) {
        return {
          success: false,
          error: 'Request entity too large',
          response: new NextResponse('Request entity too large', { status: 413 })
        }
      }

      // Rate limiting
      if (options.rateLimitKey) {
        const rateLimit = await applyRateLimit(request, options.rateLimitKey)
        if (!rateLimit.success) {
          return {
            success: false,
            error: 'Too many requests',
            response: new NextResponse(
              JSON.stringify({ error: 'Too many requests' }),
              { 
                status: 429, 
                headers: {
                  ...Object.fromEntries(rateLimit.headers.entries()),
                  'Content-Type': 'application/json'
                }
              }
            )
          }
        }
      }

      // Authentication check
      if (options.requireAuth) {
        const { userId } = await auth()
        if (!userId) {
          return {
            success: false,
            error: 'Authentication required',
            response: new NextResponse(
              JSON.stringify({ error: 'Authentication required' }),
              { 
                status: 401,
                headers: { 'Content-Type': 'application/json' }
              }
            )
          }
        }
      }

      // Parse and validate request body if schema is provided
      if (schema && request.method !== 'GET') {
        try {
          const body = await request.json()
          
          // XSS check on string values
          if (options.enableXSSCheck) {
            const hasXSS = this.checkForXSS(body)
            if (hasXSS) {
              return {
                success: false,
                error: 'Potentially malicious content detected',
                response: new NextResponse(
                  JSON.stringify({ error: 'Invalid input detected' }),
                  { 
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                  }
                )
              }
            }
          }

          const result = schema.safeParse(body)
          if (!result.success) {
            return {
              success: false,
              error: 'Validation failed',
              details: result.error.errors,
              response: new NextResponse(
                JSON.stringify({ 
                  error: 'Validation failed',
                  details: result.error.format()
                }),
                { 
                  status: 400,
                  headers: { 'Content-Type': 'application/json' }
                }
              )
            }
          }

          return {
            success: true,
            data: result.data
          }
        } catch (error) {
          return {
            success: false,
            error: 'Invalid JSON',
            response: new NextResponse(
              JSON.stringify({ error: 'Invalid JSON' }),
              { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              }
            )
          }
        }
      }

      return { success: true }
    } catch (error) {
      console.error('API validation error:', error)
      return {
        success: false,
        error: 'Validation failed',
        response: new NextResponse(
          JSON.stringify({ error: 'Internal server error' }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }
  }

  /**
   * Check for XSS patterns in request data
   */
  private static checkForXSS(data: any): boolean {
    if (typeof data === 'string') {
      return XSSProtection.detectXSS(data)
    }
    
    if (Array.isArray(data)) {
      return data.some(item => this.checkForXSS(item))
    }
    
    if (typeof data === 'object' && data !== null) {
      return Object.values(data).some(value => this.checkForXSS(value))
    }
    
    return false
  }

  /**
   * Create a validation middleware for API routes
   */
  static createValidator<T>(
    schema?: z.ZodSchema<T>,
    options: ValidationOptions = {}
  ) {
    return async (request: NextRequest) => {
      const validation = await this.validateRequest(request, schema, options)
      
      if (!validation.success && validation.response) {
        return validation.response
      }
      
      return validation
    }
  }

  /**
   * Sanitize response data to prevent XSS
   */
  static sanitizeResponse(data: any): any {
    if (typeof data === 'string') {
      return XSSProtection.sanitizeHtml(data)
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeResponse(item))
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeResponse(value)
      }
      return sanitized
    }
    
    return data
  }

  /**
   * Create a secure JSON response with proper headers
   */
  static createSecureResponse(data: any, status: number = 200): NextResponse {
    const sanitizedData = this.sanitizeResponse(data)
    
    const response = NextResponse.json(sanitizedData, { status })
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    
    return response
  }
}

/**
 * Higher-order function to wrap API routes with validation
 */
export function withValidation<T>(
  handler: (request: NextRequest, data?: T) => Promise<NextResponse>,
  schema?: z.ZodSchema<T>,
  options: ValidationOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const validation = await APIValidator.validateRequest(request, schema, options)
      
      if (!validation.success) {
        return validation.response || new NextResponse('Validation failed', { status: 400 })
      }
      
      return await handler(request, validation.data)
    } catch (error) {
      console.error('API route error:', error)
      return APIValidator.createSecureResponse(
        { error: 'Internal server error' },
        500
      )
    }
  }
}

/**
 * Utility for creating standardized error responses
 */
export const APIError = {
  badRequest: (message: string = 'Bad request', details?: any) =>
    APIValidator.createSecureResponse({ error: message, details }, 400),
    
  unauthorized: (message: string = 'Unauthorized') =>
    APIValidator.createSecureResponse({ error: message }, 401),
    
  forbidden: (message: string = 'Forbidden') =>
    APIValidator.createSecureResponse({ error: message }, 403),
    
  notFound: (message: string = 'Not found') =>
    APIValidator.createSecureResponse({ error: message }, 404),
    
  methodNotAllowed: (message: string = 'Method not allowed') =>
    APIValidator.createSecureResponse({ error: message }, 405),
    
  tooManyRequests: (message: string = 'Too many requests') =>
    APIValidator.createSecureResponse({ error: message }, 429),
    
  internalError: (message: string = 'Internal server error') =>
    APIValidator.createSecureResponse({ error: message }, 500),
    
  validationError: (details: any) =>
    APIValidator.createSecureResponse({ 
      error: 'Validation failed', 
      details 
    }, 400)
} 