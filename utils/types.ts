import { z } from 'zod';

export type userCreateProps = z.infer<typeof userCreateSchema>;

const userCreateSchema = z.object({
  email: z.string().email({ message: 'Invalid email' }).describe('user email'),
  first_name: z
    .string()
    .min(1, { message: 'First name is required' })
    .optional()
    .describe('user first name'),
  last_name: z
    .string()
    .min(1, { message: 'Last name is required' })
    .optional()
    .describe('user last name'),
  profile_image_url: z
    .string()
    .url({ message: 'Invalid URL' })
    .optional()
    .nullable()
    .describe('user profile image URL'),
  user_id: z.string().describe('user ID'),
});

export type userUpdateProps = z.infer<typeof userUpdateSchema>;

const userUpdateSchema = z.object({
  email: z
    .string()
    .email({ message: 'Invalid email' })
    .nonempty({ message: 'Email is required' })
    .describe('user email'),
  first_name: z
    .string()
    .min(1, { message: 'First name is required' })
    .optional()
    .describe('user first name'),
  last_name: z
    .string()
    .min(1, { message: 'Last name is required' })
    .optional()
    .describe('user last name'),
  profile_image_url: z
    .string()
    .url({ message: 'Invalid URL' })
    .optional()
    .nullable()
    .describe('user profile image URL'),
  user_id: z.string().describe('user ID'),
});
