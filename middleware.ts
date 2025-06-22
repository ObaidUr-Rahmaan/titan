import { NextResponse } from 'next/server';
import config from './config';
import { createServerActionClient } from '@/lib/supabase';
import { isTrialExpiredForUser } from '@/utils/middleware/trial-check';

let clerkMiddleware: (arg0: (auth: any, req: any) => any) => { (arg0: any): any; new (): any },
  createRouteMatcher;

if (config.auth.enabled) {
  try {
    ({ clerkMiddleware, createRouteMatcher } = require('@clerk/nextjs/server'));
  } catch (error) {
    console.warn('Clerk modules not available. Auth will be disabled.');
    config.auth.enabled = false;
  }
}

const isProtectedRoute = config.auth.enabled ? createRouteMatcher(['/dashboard(.*)', '/org/(.*)']) : () => false;
const isOnboardingRoute = config.auth.enabled ? createRouteMatcher(['/onboarding(.*)']) : () => false;
const isOrganizationRoute = config.auth.enabled ? createRouteMatcher(['/org/(.*)']) : () => false;

const isTrialExpiredRoute = config.auth.enabled ? createRouteMatcher(['/trial-expired']) : () => false;
const isApiRoute = (req: any) => req.nextUrl.pathname.startsWith('/api');

// List of allowed origins for CORS - Add your frontend URL and other trusted domains
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  // Add more trusted domains if needed
];

export default function middleware(req: any) {
  // Handle CORS for API routes
  if (isApiRoute(req)) {
    const origin = req.headers.get('origin');
    
    // Create base response
    const response = NextResponse.next();
    
    // Always allow the built-in frontend to access the API
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    // Only allow specified origins
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    } else {
      // For non-allowed origins, set origin to null (blocks the request in browsers)
      response.headers.set('Access-Control-Allow-Origin', 'null');
    }
    
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
      
      return response;
    }
    
    // For clerk-based auth, proceed with auth check after setting CORS headers
    if (config.auth.enabled) {
      return clerkMiddleware(async (auth, req) => {
        // Any additional auth checks for API routes
        return response;
      })(req);
    }
    
    return response;
  }

  // Handle non-API routes with clerk middleware if enabled
  if (config.auth.enabled) {
    return clerkMiddleware(async (auth, req) => {
      const { userId } = await auth();
      const path = req.nextUrl.pathname;
      
      // If user is not authenticated and tries to access protected routes
      if (!userId && (isProtectedRoute(req) || isOnboardingRoute(req) || isTrialExpiredRoute(req))) {
        // Redirect to sign-in, CSP will be applied by next.config.js
        return NextResponse.redirect(new URL('/sign-in', req.url));
      }
      
      // User is authenticated
      if (userId) {
        // Allow Clerk to handle redirects for sign-in/sign-up pages
        if (path.startsWith('/sign-in') || path.startsWith('/sign-up')) {
          return NextResponse.next(); // Let Clerk handle the redirect
        }
        
        // For organization routes, perform additional validation
        if (isOrganizationRoute(req)) {
          // Extract organization slug from URL path: /org/[orgSlug]/...
          const pathSegments = path.split('/');
          const orgSlug = pathSegments[2]; // /org/[orgSlug]/page
          
          if (!orgSlug) {
            console.log('🚫 ORG ROUTE: No organization slug in path', { userId, path });
            return NextResponse.redirect(new URL('/dashboard?error=invalid-organization', req.url));
          }
          
          // Check trial status for organization routes too
          try {
            const trialExpired = await isTrialExpiredForUser(userId);
            if (trialExpired) {
              console.log('🚫 TRIAL EXPIRED: Redirecting from organization route to trial expired page', { userId, path, orgSlug });
              return NextResponse.redirect(new URL('/trial-expired', req.url));
            }
          } catch (error) {
            console.error('Error checking trial status for organization route:', error);
            // On error, allow access (fail open) - let layout handle validation
          }
          
          // Organization membership validation is handled by the layout component
          // This provides better error handling and user experience
          // The layout will redirect if user doesn't have access to the organization
        }
        
        // For dashboard access, check trial status and onboarding
        if (path.startsWith('/dashboard')) {
          // Check if user's trial has expired
          try {
            const trialExpired = await isTrialExpiredForUser(userId);
            if (trialExpired) {
              console.log('🚫 TRIAL EXPIRED: Redirecting user to trial expired page', { userId, path });
              return NextResponse.redirect(new URL('/trial-expired', req.url));
            }
          } catch (error) {
            console.error('Error checking trial status in middleware:', error);
            // On error, allow access (fail open)
          }
          
          // We'll rely on a client-side check in the Dashboard component
          // The Dashboard component should check if the user has completed onboarding
          // and redirect to /onboarding if needed
          
          // Important: We need to make sure the Dashboard component implements this check
          // by calling the /api/user/check-onboarding endpoint
        }
        
        // Allow access to trial expired page for authenticated users
        if (path.startsWith('/trial-expired')) {
          return NextResponse.next(); // CSP will be applied by next.config.js
        }
        
        // If user is authenticated, they can access onboarding directly
        if (path.startsWith('/onboarding')) {
          return NextResponse.next(); // CSP will be applied by next.config.js
        }
        
        // If user is going to home page and is authenticated, check trial status
        if (path === '/') {
          // Check if user's trial has expired
          try {
            const trialExpired = await isTrialExpiredForUser(userId);
            if (trialExpired) {
              // Allow expired trial users to access homepage - don't redirect to dashboard
              console.log('🏠 HOMEPAGE: Allowing expired trial user to access homepage', { userId });
              return NextResponse.next(); // CSP will be applied by next.config.js
            }
          } catch (error) {
            console.error('Error checking trial status for homepage access:', error);
            // On error, allow access (fail open)
            return NextResponse.next();
          }
          
          // For non-expired users, check referer to avoid redirect loops
          const referer = req.headers.get('referer');
          const isFromAccessRestricted = referer && referer.includes('/access-restricted');
          
          // Allow users coming from access-restricted to stay on homepage
          if (isFromAccessRestricted) {
            console.log('🏠 HOMEPAGE: User coming from access-restricted, allowing homepage access', { userId });
            return NextResponse.next();
          }
          
          // For other cases, let the client-side handle authorization checks
          // This avoids middleware complexity and lets dashboard layout handle authorization
          console.log('🏠 HOMEPAGE: Allowing homepage access, client will handle auth checks', { userId });
          return NextResponse.next();
        }
      }
      
      return NextResponse.next(); // CSP will be applied by next.config.js
    })(req);
  } else {
    // CSP will be applied by next.config.js
    return NextResponse.next();
  }
}

export const middlewareConfig = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
