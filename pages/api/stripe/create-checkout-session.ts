// pages/api/stripe/create-checkout-session.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Price tier mapping
// IMPORTANT: Replace these placeholder IDs with actual Stripe price IDs from your dashboard
// Real Stripe price IDs look like: price_1A2B3C4D5E6F7G8H9I0J
const PRICE_IDS: Record<string, string> = {
  basic: 'price_basic',
  pro: 'price_pro',
  premium: 'price_premium',
};

interface CheckoutRequest {
  tier: 'basic' | 'pro' | 'premium';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // Validate user session
    const session = await getSession({ req });
    if (!session?.user?.id || !session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = session.user.id as string;
    const userEmail = session.user.email as string;

    // Parse and validate request body
    const { tier } = req.body as CheckoutRequest;

    if (!tier || !['basic', 'pro', 'premium'].includes(tier)) {
      return res.status(400).json({ 
        error: 'Invalid tier. Must be one of: basic, pro, premium' 
      });
    }

    const priceId = PRICE_IDS[tier];

    if (!priceId) {
      return res.status(400).json({ error: 'Invalid pricing tier' });
    }

    // Warn if using placeholder IDs
    // Real Stripe price IDs follow the pattern: price_<24+ alphanumeric characters>
    // Placeholder IDs are just: price_<descriptive_name>
    if (priceId && priceId.startsWith('price_') && !priceId.match(/^price_[0-9A-Za-z]{24,}$/)) {
      console.warn(`Warning: Using placeholder price ID '${priceId}'. Replace with actual Stripe price ID for production.`);
    }

    // Create Stripe Checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing`,
      customer_email: userEmail,
      metadata: {
        userId,
        tier,
      },
      subscription_data: {
        metadata: {
          userId,
          tier,
        },
      },
    });

    return res.status(200).json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return res.status(400).json({ 
        error: 'Stripe error',
        message: error.message 
      });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}