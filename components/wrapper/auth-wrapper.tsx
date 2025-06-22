'use client';

import type { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import config from '@/config';

interface AuthWrapperProps {
  children: ReactNode;
}

// This is a client component that wraps the ClerkProvider
// No need for headers() here as it's not a server component accessing Clerk APIs directly
const AuthWrapper = ({ children }: AuthWrapperProps) => {
  if (!config.auth.enabled) {
    return <>{children}</>;
  }

  return <ClerkProvider>{children}</ClerkProvider>;
};

export default AuthWrapper;
