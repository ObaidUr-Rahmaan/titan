'server only';

import { clerkClient } from '@clerk/nextjs/server';
import { createDirectClient } from '@/lib/drizzle';
import { subscriptions } from '@/db/schema/subscriptions';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';
import config from '@/config';
import { headers } from 'next/headers';

export const isAuthorized = async (
  clerkUserId: string
): Promise<{ authorized: boolean; message: string }> => {
  // Force headers evaluation first to avoid headers() errors
  await headers();
  
  if (!config.payments.enabled) {
    return {
      authorized: true,
      message: 'Payments are disabled',
    };
  }

  const client = await clerkClient();
  const result = await client.users.getUser(clerkUserId);

  if (!result) {
    return {
      authorized: false,
      message: 'User not found',
    };
  }

  try {
    const db = createDirectClient();
    
    // First try to find subscriptions directly by Clerk user ID (more efficient)
    let userSubscriptions = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.clerkUserId, clerkUserId));

    // If no direct match, try looking up via user table
    if (userSubscriptions.length === 0) {
      // Find the user by their Clerk user ID to get the internal user ID
      const userRecord = await db.select()
        .from(users)
        .where(eq(users.clerkUserId, clerkUserId))
        .limit(1);

      if (userRecord.length === 0) {
        return {
          authorized: false,
          message: 'User record not found in database',
        };
      }

      const internalUserId = userRecord[0].id;

      // Now check their subscriptions using the internal user ID
      userSubscriptions = await db.select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, internalUserId));
    }

    if (userSubscriptions.length === 0) {
      return {
        authorized: false,
        message: 'No subscription found',
      };
    }

    if (userSubscriptions[0].status === 'active') {
      return {
        authorized: true,
        message: 'User is subscribed',
      };
    }

    return {
      authorized: false,
      message: 'User is not subscribed',
    };
  } catch (error: any) {
    console.error('Failed to check authorization:', error);
    return {
      authorized: false,
      message: error.message,
    };
  }
};
