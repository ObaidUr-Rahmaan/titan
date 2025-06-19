import { NextRequest, NextResponse } from 'next/server';
import { createServerActionClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createServerActionClient();
    
    // Get user profile to check trial status
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('subscription_status, trial_end')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return NextResponse.json(
        { 
          isTrial: false,
          subscriptionStatus: 'unknown',
          isExpired: false
        },
        { status: 200 }
      );
    }

    const now = new Date();
    const trialEnd = profile?.trial_end ? new Date(profile.trial_end) : null;
    const isExpired = trialEnd ? now > trialEnd : false;
    const isTrial = profile?.subscription_status === 'trial' || profile?.subscription_status === 'trialing';

    return NextResponse.json({
      isTrial,
      subscriptionStatus: profile?.subscription_status || 'trial',
      isExpired: isTrial && isExpired,
      trialEnd: trialEnd?.toISOString()
    });

  } catch (error) {
    console.error('Error in trial-info API:', error);
    return NextResponse.json(
      { 
        isTrial: false,
        subscriptionStatus: 'unknown',
        isExpired: false
      },
      { status: 200 }
    );
  }
} 