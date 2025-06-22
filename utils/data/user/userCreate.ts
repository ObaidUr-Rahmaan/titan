'server only';

import { userCreateProps } from '@/utils/types';
import { createDirectClient } from '@/lib/drizzle';
import { users } from '@/db/schema/users';

export const userCreate = async ({
  email,
  first_name,
  last_name,
  profile_image_url,
  user_id,
}: userCreateProps) => {
  try {
    const db = createDirectClient();
    
    const newUser = await db.insert(users)
      .values({
        email,
        firstName: first_name || null,
        lastName: last_name || null,
        profileImageUrl: profile_image_url || null,
        clerkUserId: user_id, // Map Clerk user ID to clerkUserId field
        // userId field will auto-generate a CUID2
      })
      .returning();

    if (newUser.length > 0) return newUser[0];
    return { error: 'User not created' };
  } catch (error: any) {
    console.error('Failed to create user:', error);
    return { error: error.message };
  }
};
