'server only';

import { clerkClient } from '@clerk/nextjs/server';
import { createDirectClient } from '@/lib/drizzle';
import { subscriptions } from '@/db/schema/subscriptions';
import { eq } from 'drizzle-orm';
import config from '@/config';
import { headers } from 'next/headers';

export const isAuthorized = async (
  userId: string
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
  const result = await client.users.getUser(userId);

  if (!result) {
    return {
      authorized: false,
      message: 'User not found',
    };
  }

  try {
    const db = createDirectClient();
    const userSubscriptions = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));

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
