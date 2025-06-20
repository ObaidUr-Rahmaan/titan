'use server';

import { auth } from '@clerk/nextjs/server';
import { createDirectClient } from '@/lib/drizzle';
import { users } from '@/db/schema/users';
import { headers } from 'next/headers';

export async function actionTemplate() {
  // Force headers evaluation first to avoid headers() errors
  await headers();
  
  const { userId } = await auth();

  if (!userId) {
    return 'You must be signed in';
  }

  try {
    const db = createDirectClient();
    const userRecords = await db.select().from(users);

    return userRecords;
  } catch (error: any) {
    throw new Error(error.message);
  }
}
