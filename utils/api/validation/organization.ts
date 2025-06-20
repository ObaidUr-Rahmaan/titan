'server only';

import { z } from 'zod';

// Base organization schema
export const organizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  industry: z.string().optional(),
  employeeCount: z.number().int().positive().optional(),
});

// Create organization request
export const createOrganizationSchema = organizationSchema;

// Update organization request
export const updateOrganizationSchema = organizationSchema.partial();

// Organization member role schema
export const memberRoleSchema = z.enum(['admin', 'member']);

// Add member request
export const addMemberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: memberRoleSchema.default('member'),
});

// Update member request
export const updateMemberSchema = z.object({
  role: memberRoleSchema,
});

// Invitation request
export const invitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: memberRoleSchema.default('member'),
  message: z.string().optional(),
});

// Query parameters for organization list
export const organizationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Member query parameters
export const memberQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  role: memberRoleSchema.optional(),
  search: z.string().optional(),
});

// Invitation query parameters
export const invitationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['pending', 'accepted', 'rejected', 'expired']).optional(),
});

// Type exports
export type CreateOrganizationRequest = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationRequest = z.infer<typeof updateOrganizationSchema>;
export type AddMemberRequest = z.infer<typeof addMemberSchema>;
export type UpdateMemberRequest = z.infer<typeof updateMemberSchema>;
export type InvitationRequest = z.infer<typeof invitationSchema>;
export type OrganizationQuery = z.infer<typeof organizationQuerySchema>;
export type MemberQuery = z.infer<typeof memberQuerySchema>;
export type InvitationQuery = z.infer<typeof invitationQuerySchema>;
export type MemberRole = z.infer<typeof memberRoleSchema>; 