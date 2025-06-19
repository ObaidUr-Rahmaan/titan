import { z } from 'zod'

// Base validation schemas
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10)
})

export const dateRangeSchema = z.object({
  from: z.date().optional(),
  to: z.date().optional()
})

export const searchSchema = z.object({
  query: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
})

// User validation schemas
export const userProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  company: z.string().max(100).optional(),
  jobTitle: z.string().max(100).optional(),
  bio: z.string().max(500).optional()
})

export const userSettingsSchema = z.object({
  receiveEmailNotifications: z.boolean().default(true),
  receiveMarketingEmails: z.boolean().default(false),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  language: z.string().default('en'),
  timezone: z.string().default('UTC')
})

// Authentication schemas
export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional()
})

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions')
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export const passwordResetSchema = z.object({
  email: z.string().email('Invalid email address')
})

export const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

// Payment and subscription schemas
export const checkoutSessionSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
  userId: z.string().optional(),
  email: z.string().email().optional(),
  subscription: z.boolean().optional().default(false),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional()
})

export const subscriptionTierSchema = z.enum(['basic', 'pro', 'business'], {
  errorMap: () => ({ message: "Please select a valid subscription tier" })
})

export const subscriptionChangeSchema = z.object({
  targetTier: subscriptionTierSchema,
  reason: z.string().max(500).optional()
})

export const billingPortalSchema = z.object({
  returnUrl: z.string().url('Invalid return URL').optional()
})

// Contact and support schemas
export const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
  priority: z.enum(['low', 'medium', 'high']).default('medium')
})

export const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'improvement', 'other']),
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  category: z.string().max(50).optional(),
  reproductionSteps: z.string().max(1000).optional(),
  expectedBehavior: z.string().max(500).optional(),
  actualBehavior: z.string().max(500).optional()
})

// File upload schemas
export const fileUploadSchema = z.object({
  file: z.instanceof(File)
    .refine(file => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
    .refine(file => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type), 'Only JPEG, PNG, and WebP images are allowed'),
  alt: z.string().max(200).optional()
})

export const documentUploadSchema = z.object({
  file: z.instanceof(File)
    .refine(file => file.size <= 10 * 1024 * 1024, 'File size must be less than 10MB')
    .refine(file => ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type), 'Only PDF, TXT, DOC, and DOCX files are allowed'),
  description: z.string().max(500).optional()
})

// API key and webhook schemas
export const apiKeySchema = z.object({
  name: z.string().min(1, 'API key name is required').max(100),
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
  expiresAt: z.date().optional()
})

export const webhookSchema = z.object({
  url: z.string().url('Invalid webhook URL'),
  events: z.array(z.string()).min(1, 'At least one event type is required'),
  secret: z.string().min(16, 'Webhook secret must be at least 16 characters').optional(),
  isActive: z.boolean().default(true)
})

// URL validation with enhanced security
export const urlSchema = z.string()
  .url('Invalid URL format')
  .refine(url => {
    try {
      const parsed = new URL(url)
      // Only allow HTTP and HTTPS protocols
      return ['http:', 'https:'].includes(parsed.protocol)
    } catch {
      return false
    }
  }, 'URL must use HTTP or HTTPS protocol')
  .refine(url => {
    try {
      const parsed = new URL(url)
      // Prevent localhost and private IP ranges in production
      if (process.env.NODE_ENV === 'production') {
        const hostname = parsed.hostname.toLowerCase()
        if (
          hostname === 'localhost' ||
          hostname.startsWith('127.') ||
          hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          hostname.startsWith('172.16.') ||
          /^\d+\.\d+\.\d+\.\d+$/.test(hostname)
        ) {
          return false
        }
      }
      return true
    } catch {
      return false
    }
  }, 'Invalid URL - localhost and private IPs not allowed in production')

// Enhanced email validation
export const emailSchema = z.string()
  .email('Invalid email address')
  .max(254, 'Email address too long')
  .refine(email => {
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }, 'Invalid email format')
  .refine(email => {
    // Prevent obviously fake emails
    const domain = email.split('@')[1]?.toLowerCase()
    const fakeDomains = ['example.com', 'test.com', 'fake.com', 'invalid.com']
    return !fakeDomains.includes(domain)
  }, 'Please use a valid email address')

// Phone number validation
export const phoneSchema = z.string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .min(10, 'Phone number too short')
  .max(15, 'Phone number too long')

// Admin and moderation schemas
export const adminUserUpdateSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(['user', 'admin', 'moderator']),
  isActive: z.boolean(),
  notes: z.string().max(1000).optional()
})

export const moderationActionSchema = z.object({
  targetId: z.string().min(1, 'Target ID is required'),
  action: z.enum(['warn', 'suspend', 'ban', 'delete']),
  reason: z.string().min(1, 'Reason is required').max(500),
  duration: z.number().positive().optional(), // Duration in days for temporary actions
  isPublic: z.boolean().default(false)
})

// Export all schemas as a single object for easier imports
export const schemas = {
  pagination: paginationSchema,
  dateRange: dateRangeSchema,
  search: searchSchema,
  userProfile: userProfileSchema,
  userSettings: userSettingsSchema,
  signIn: signInSchema,
  signUp: signUpSchema,
  passwordReset: passwordResetSchema,
  passwordUpdate: passwordUpdateSchema,
  checkoutSession: checkoutSessionSchema,
  subscriptionTier: subscriptionTierSchema,
  subscriptionChange: subscriptionChangeSchema,
  billingPortal: billingPortalSchema,
  contactForm: contactFormSchema,
  feedback: feedbackSchema,
  fileUpload: fileUploadSchema,
  documentUpload: documentUploadSchema,
  apiKey: apiKeySchema,
  webhook: webhookSchema,
  url: urlSchema,
  email: emailSchema,
  phone: phoneSchema,
  adminUserUpdate: adminUserUpdateSchema,
  moderationAction: moderationActionSchema
}

// Helper function for validation with better error messages
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string; details?: any } {
  try {
    const result = schema.safeParse(data)
    if (result.success) {
      return { success: true, data: result.data }
    }
    
    // Format Zod errors into a user-friendly message
    const errors = result.error.errors.map(err => {
      const path = err.path.length > 0 ? `${err.path.join('.')}: ` : ''
      return `${path}${err.message}`
    }).join(', ')
    
    return { 
      success: false, 
      error: errors,
      details: result.error.errors
    }
  } catch (error) {
    return { 
      success: false, 
      error: 'Validation failed',
      details: error
    }
  }
} 