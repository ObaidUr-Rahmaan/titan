/**
 * Configuration validator for environment variables
 * Checks required environment variables for different features
 */

const REQUIRED_ENV_VARS = {
  // Authentication
  auth: ['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY'],
  
  // Database
  database: ['DATABASE_URL'],
  
  // Payments
  payments: ['STRIPE_SECRET_KEY', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'STRIPE_WEBHOOK_SECRET'],
  
  // Email
  email: ['PLUNK_API_KEY'],
  
  // Analytics
  analytics: ['NEXT_PUBLIC_VERCEL_ANALYTICS_ID'],
} as const;

export function validateConfig(features: (keyof typeof REQUIRED_ENV_VARS)[] = []) {
  const missing: string[] = [];
  
  for (const feature of features) {
    const vars = REQUIRED_ENV_VARS[feature];
    if (!vars) continue;
    
    for (const envVar of vars) {
      if (!process.env[envVar]) {
        missing.push(envVar);
      }
    }
  }
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables for features [${features.join(', ')}]: ${missing.join(', ')}`
    );
  }
  
  return true;
}
