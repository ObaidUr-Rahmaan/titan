'use client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Loader2, ExternalLink } from 'lucide-react';
import config from '@/config';
import { useUser } from '@clerk/nextjs';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Settings() {
  let user = null;
  const [billingLoading, setBillingLoading] = useState(false);

  if (config?.auth?.enabled) {
    user = useUser();
  }

  const handleManageBilling = async () => {
    try {
      setBillingLoading(true);
      const response = await fetch('/api/payments/create-portal-session', {
        method: 'POST'
      });

      if (response.ok) {
        const { url } = await response.json();
        window.open(url, '_blank');
        toast.success('Opening billing portal...');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create billing portal session');
      }
    } catch (error: any) {
      console.error('Failed to open billing portal:', error);
      toast.error(error.message || 'Failed to open billing management. Please try again.');
    } finally {
      setBillingLoading(false);
    }
  };

  return (
    <div className="flex justify-start items-center flex-wrap px-4 pt-5 gap-4">
      <div className="flex flex-col gap-6 mb-[5rem] w-full max-w-[700px]">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
            <CardDescription>
              Your account information and personal details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex w-full gap-3">
              <div className="flex flex-col gap-3 w-full">
                <Label>First Name</Label>
                <Input disabled defaultValue={user?.user?.firstName ? user?.user?.firstName : ''} />
              </div>
              <div className="flex flex-col gap-3 w-full">
                <Label>Last Name</Label>
                <Input disabled defaultValue={user?.user?.lastName ? user?.user?.lastName : ''} />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label>E-mail</Label>
              <Input disabled defaultValue={user?.user?.emailAddresses?.[0]?.emailAddress!} />
            </div>
          </CardContent>
        </Card>

        {/* Billing Management Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <CardTitle>Billing & Subscription</CardTitle>
            </div>
            <CardDescription>
              Manage your subscription, billing information, and payment methods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">
                  Access your Stripe billing portal to:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Update payment methods</li>
                  <li>Download invoices</li>
                  <li>View billing history</li>
                  <li>Update billing address</li>
                </ul>
              </div>
              <Button 
                onClick={handleManageBilling}
                disabled={billingLoading}
                className="w-full sm:w-auto"
              >
                {billingLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Opening...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Manage Billing
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
