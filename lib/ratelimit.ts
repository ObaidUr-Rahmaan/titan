import type { NextRequest } from "next/server";

/**
 * In-memory rate limiting store
 */
class RateLimitStore {
  private attempts = new Map<string, { count: number; resetTime: number }>()
  
  /**
   * Check if request should be rate limited
   */
  checkLimit(
    identifier: string, 
    maxAttempts: number, 
    windowMs: number
  ): { success: boolean; limit: number; remaining: number; reset: number } {
    const now = Date.now()
    const key = `rate_limit:${identifier}`
    const current = this.attempts.get(key)
    
    // Reset if window has expired
    if (!current || now > current.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + windowMs })
      return { 
        success: true, 
        limit: maxAttempts, 
        remaining: maxAttempts - 1, 
        reset: now + windowMs 
      }
    }
    
    // Increment attempts
    current.count++
    this.attempts.set(key, current)
    
    const remaining = Math.max(0, maxAttempts - current.count)
    const success = current.count <= maxAttempts
    
    return { 
      success, 
      limit: maxAttempts, 
      remaining, 
      reset: current.resetTime 
    }
  }
  
  /**
   * Clear rate limit for identifier
   */
  clearLimit(identifier: string): void {
    const key = `rate_limit:${identifier}`
    this.attempts.delete(key)
  }
  
  /**
   * Clean up expired entries (optional maintenance)
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, value] of this.attempts.entries()) {
      if (now > value.resetTime) {
        this.attempts.delete(key)
      }
    }
  }
}

// Global rate limit store
const rateLimitStore = new RateLimitStore()

// Clean up expired entries every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => {
    rateLimitStore.cleanup()
  }, 5 * 60 * 1000)
}

/**
 * Configuration for different rate limiting scenarios
 */
const RATE_LIMITS = {
  /**
   * General API rate limit - 20 requests per 10 seconds
   */
  api: { maxAttempts: 20, windowMs: 10 * 1000 },
  
  /**
   * Authentication endpoints - 5 requests per minute
   * Helps prevent brute force attacks
   */
  auth: { maxAttempts: 5, windowMs: 60 * 1000 },
  
  /**
   * Payment endpoints - 10 requests per minute
   */
  payment: { maxAttempts: 10, windowMs: 60 * 1000 },
  
  /**
   * Strict rate limit for sensitive operations - 3 requests per minute
   */
  strict: { maxAttempts: 3, windowMs: 60 * 1000 },
  
  /**
   * Public endpoints - 50 requests per minute
   */
  public: { maxAttempts: 50, windowMs: 60 * 1000 },
}

/**
 * Get client identifier from request
 * Uses IP address, falling back to a fingerprint of user agent and other headers
 */
export function getClientIdentifier(req: NextRequest): string {
  // Get IP from various headers
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = cfConnectingIp || forwardedFor || realIp || "anonymous";
  
  return ip;
}

/**
 * Apply rate limiting to a request and return whether it was successful
 * @param req The Next.js request object
 * @param limiterKey The rate limiter to use (api, auth, payment, strict, public)
 * @returns Object with success flag and rate limit information
 */
export async function applyRateLimit(
  req: NextRequest, 
  limiterKey: "api" | "auth" | "payment" | "strict" | "public" = "api"
) {
  try {
    const identifier = getClientIdentifier(req);
    const config = RATE_LIMITS[limiterKey];
    
    if (!config) {
      throw new Error(`Rate limiter '${limiterKey}' not available`);
    }
    
    const result = rateLimitStore.checkLimit(
      identifier, 
      config.maxAttempts, 
      config.windowMs
    );
    
    // Add rate limit headers to the response
    const headers = new Headers();
    headers.set("X-RateLimit-Limit", result.limit.toString());
    headers.set("X-RateLimit-Remaining", result.remaining.toString());
    headers.set("X-RateLimit-Reset", result.reset.toString());
    
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      headers,
    };
  } catch (error) {
    console.error("Rate limiting error:", error);
    // If rate limiting fails, we allow the request through to avoid blocking legitimate traffic
    return { 
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
      headers: new Headers()
    };
  }
}

/**
 * Rate limit middleware helper for API routes
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<Response>,
  limiterKey: "api" | "auth" | "payment" | "strict" | "public" = "api"
) {
  return async (req: NextRequest) => {
    const rateLimit = await applyRateLimit(req, limiterKey);
    
    if (!rateLimit.success) {
      return new Response(
        JSON.stringify({ 
          error: "Too many requests",
          retryAfter: Math.ceil((rateLimit.reset - Date.now()) / 1000)
        }),
        { 
          status: 429, 
          headers: {
            ...Object.fromEntries(rateLimit.headers.entries()),
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    const response = await handler(req);
    
    // Add rate limit headers to successful responses
    rateLimit.headers.forEach((value, key) => {
      response.headers.set(key, value);
    });
    
    return response;
  };
}

/**
 * Clear rate limit for a specific identifier (useful for testing or admin overrides)
 */
export function clearRateLimit(identifier: string): void {
  rateLimitStore.clearLimit(identifier);
} 