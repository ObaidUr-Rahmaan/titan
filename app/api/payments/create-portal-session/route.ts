import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    })
  : undefined

export async function POST() {
  try {
    if (!stripe) {
      console.error('[BILLING PORTAL] Missing STRIPE_SECRET_KEY environment variable')
      return NextResponse.json({ error: 'Payment system not configured' }, { status: 500 })
    }

    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's Stripe customer ID from database
    const supabase = createClient()
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('stripe_user_id')
      .eq('user_id', userId)
      .single()

    if (error || !subscription?.stripe_user_id) {
      console.error('[BILLING PORTAL] No subscription found for user:', userId, error)
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    // Create billing portal session
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_user_id,
      return_url: `${baseUrl}/dashboard`,
    })

    console.log('[BILLING PORTAL] Created session for user:', userId, 'customer:', subscription.stripe_user_id)
    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('[BILLING PORTAL] Error creating billing portal session:', error)
    
    // Handle Stripe configuration error specifically
    if (error?.type === 'StripeInvalidRequestError' && 
        error?.message?.includes('No configuration provided')) {
      return NextResponse.json(
        { error: 'Billing portal not configured. Please contact support.' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    )
  }
} 