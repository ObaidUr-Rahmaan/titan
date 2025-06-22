'use client';
import PageWrapper from '@/components/wrapper/page-wrapper';
import config from '@/config';
import { UserProfile } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useRouter } from 'next/navigation';

const UserProfilePage = () => {
  const router = useRouter();

  if (!config?.auth?.enabled) {
    router.back();
  }
  return (
    <PageWrapper>
      <div className="h-full flex items-center justify-center p-9 pt-24">
        {config?.auth?.enabled && (
          <UserProfile 
            path="/user-profile" 
            routing="path"
            appearance={{
              baseTheme: dark
            }}
          />
        )}
      </div>
    </PageWrapper>
  );
};

export default UserProfilePage;
