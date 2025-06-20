import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { applyRateLimit } from '@/lib/ratelimit';
import { z } from 'zod';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : undefined;

// Input validation schema
const checkoutSchema = z.object({
  userId: z.string().optional(),
  organizationId: z.string().optional(), // Organization ID for organization billing
  email: z.string().email().optional(),
  priceId: z.string().min(1, "Price ID is required"),
  subscription: z.boolean().optional().default(false),
  quantity: z.number().min(1).optional().default(1), // For seat-based billing
  billingType: z.enum(['individual', 'organization']).optional().default('individual'),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional()
}).refine((data) => {
  // Either userId (for individual) or organizationId (for organization) must be provided
  return data.userId || data.organizationId;
}, {
  message: "Either userId or organizationId must be provided"
}).refine((data) => {
  // If billing type is organization, organizationId must be provided
  if (data.billingType === 'organization' && !data.organizationId) {
    return false;
  }
  return true;
}, {
  message: "organizationId is required for organization billing"
});

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimit = await applyRateLimit(req, "payment");
  if (!rateLimit.success) {
    return new NextResponse(
      JSON.stringify({ error: "Too many requests" }),
      { 
        status: 429, 
        headers: rateLimit.headers 
      }
    );
  }

  if (!stripe) {
    console.error('Missing STRIPE_SECRET_KEY environment variable');
    return NextResponse.json({ error: 'Stripe configuration error' }, { status: 500 });
  }

  // Parse and validate request body
  let body;
  try {
    body = await req.json();
    const result = checkoutSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: result.error.format() 
      }, { 
        status: 400,
        headers: rateLimit.headers
      });
    }
    body = result.data;
  } catch (e) {
    return NextResponse.json({ 
      error: 'Invalid JSON' 
    }, { 
      status: 400,
      headers: rateLimit.headers
    });
  }

  const { 
    userId, 
    organizationId, 
    email, 
    priceId, 
    subscription, 
    quantity,
    billingType,
    successUrl,
    cancelUrl
  } = body;

  // Construct base URLs
  const baseUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const defaultSuccessUrl = successUrl || `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`;
  const defaultCancelUrl = cancelUrl || `${baseUrl}/cancel`;

  // Prepare metadata
  const metadata: Record<string, string> = {
    email: email || '',
    subscription: subscription ? 'true' : 'false',
    billingType,
    quantity: quantity.toString()
  };

  // Add context-specific metadata
  if (billingType === 'organization' && organizationId) {
    metadata.organizationId = organizationId;
  } else if (userId) {
    metadata.userId = userId;
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    payment_method_types: ['card'],
    line_items: [{ 
      price: priceId,
      quantity: quantity
    }],
    metadata,
    mode: subscription ? 'subscription' : 'payment',
    success_url: defaultSuccessUrl,
    cancel_url: defaultCancelUrl,
    allow_promotion_codes: true,
  };

  // Add organization-specific configuration for subscriptions
  if (subscription && billingType === 'organization') {
    sessionParams.subscription_data = {
      metadata: {
        organizationId: organizationId!,
        billingType: 'organization',
        initialSeats: quantity.toString()
      }
    };
  }

  try {
    const session = await stripe.checkout.sessions.create(sessionParams);
    console.log(`[CHECKOUT] Created session ${session.id} for ${billingType} billing`);
    
    return NextResponse.json({ 
      sessionId: session.id,
      billingType,
      quantity 
    }, { 
      headers: rateLimit.headers 
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ 
      error: 'Failed to create checkout session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 400,
      headers: rateLimit.headers
    });
  }
}
