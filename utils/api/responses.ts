'server only';

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: any;
  code?: string;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  );
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: string,
  status: number = 400,
  details?: any,
  code?: string
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(details && { details }),
      ...(code && { code }),
    },
    { status }
  );
}

/**
 * Handle common API errors
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  console.error('API Error:', error);

  if (error instanceof ZodError) {
    return createErrorResponse(
      'Validation failed',
      400,
      error.errors,
      'VALIDATION_ERROR'
    );
  }

  if (error instanceof Error) {
    // Don't expose internal error messages in production
    const message = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'An internal server error occurred';
    
    return createErrorResponse(message, 500, undefined, 'INTERNAL_ERROR');
  }

  return createErrorResponse(
    'An unexpected error occurred',
    500,
    undefined,
    'UNKNOWN_ERROR'
  );
}

/**
 * Handle authentication errors
 */
export function createAuthError(message: string = 'Authentication required'): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 401, undefined, 'AUTH_ERROR');
}

/**
 * Handle authorization errors
 */
export function createForbiddenError(message: string = 'Insufficient permissions'): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 403, undefined, 'FORBIDDEN');
}

/**
 * Handle not found errors
 */
export function createNotFoundError(message: string = 'Resource not found'): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, 404, undefined, 'NOT_FOUND');
}

/**
 * Async wrapper for API route handlers with error handling
 */
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse<any>>
) {
  return async (...args: T): Promise<NextResponse<any>> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
} 