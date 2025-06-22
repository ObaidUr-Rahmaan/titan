'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CreditCard, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import config from '@/config';

export default function TrialExpiredPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    if (!userId) {
      // User is not authenticated, redirect to sign-in
      router.replace('/sign-in');
      return;
    }

    // Check if user actually has an expired trial
    const checkTrialStatus = async () => {
      // Skip trial check if disabled in config
      if (!config.auth.trialCheckEnabled) {
        router.replace('/dashboard');
        return;
      }

      try {
        const response = await fetch('/api/user/trial-info', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId })
        });

        if (response.ok) {
          const data = await response.json();
          
          // If trial is not expired, redirect to dashboard
          if (!data.isExpired) {
            router.replace('/dashboard');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking trial status:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkTrialStatus();
  }, [isLoaded, userId, router]);

  if (!isLoaded || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Checking trial status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle className="text-2xl">Trial Expired</CardTitle>
          <CardDescription>
            Your trial period has ended. Upgrade to continue using all features.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button asChild className="w-full" size="lg">
              <Link href="/pricing">
                <CreditCard className="mr-2 h-4 w-4" />
                Upgrade Now
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">
                View Dashboard
              </Link>
            </Button>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            <p>
              Need help? <Link href="/contact" className="text-primary hover:underline">Contact support</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 