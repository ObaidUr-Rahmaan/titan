'server only';

import { clerkClient } from '@clerk/nextjs/server';
import { createServerActionClient } from '@/lib/supabase';
import config from '@/config'

export const isAuthorized = async (
  userId: string
): Promise<{ authorized: boolean; message: string }> => {
  if (!config.payments.enabled) {
    return {
      authorized: true,
      message: 'Payments are disabled',
    };
  }

  const result = await clerkClient.users.getUser(userId);

  if (!result) {
    return {
      authorized: false,
      message: 'User not found',
    };
  }

  try {
    const supabase = await createServerActionClient();
    const { data, error } = await supabase.from('subscriptions').select('*').eq('user_id', userId);

    if (error?.code)
      return {
        authorized: false,
        message: error.message,
      };

    if (data && data[0].status === 'active') {
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
