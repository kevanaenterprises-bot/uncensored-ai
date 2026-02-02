// pages/api/stripe/webhook.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from 'stripe';
import { prisma } from '../../../lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const customerId = session.customer as string;

  if (!userId) {
    console.error('Missing userId in checkout session metadata');
    return;
  }

  // Update user with Stripe customer ID
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customerId },
  });
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  // Find user by Stripe customer ID
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Determine quota based on price ID or product
  const priceId = subscription.items.data[0]?.price.id;
  const quota = getQuotaForPrice(priceId);
  const tier = getTierForPrice(priceId);

  // Create or update subscription
  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    create: {
      userId: user.id,
      stripeSubscriptionId: subscription.id,
      tier,
      quota,
      used: 0,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
    update: {
      tier,
      quota,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: { status: 'canceled' },
  });
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  
  if (!subscriptionId) return;

  // Reset usage quota for new billing period
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscriptionId },
    data: { used: 0 },
  });
}

function getQuotaForPrice(priceId?: string): number {
  // Map price IDs to quotas
  // IMPORTANT: Replace these placeholder IDs with actual Stripe price IDs from your dashboard
  const quotaMap: Record<string, number> = {
    'price_basic': 10000,
    'price_pro': 50000,
    'price_premium': 200000,
  };

  const quota = quotaMap[priceId || ''];
  
  // Validate that price IDs have been configured
  if (!quota && priceId && !priceId.startsWith('price_')) {
    console.error(`Unknown price ID: ${priceId}. Please configure in getQuotaForPrice()`);
  }
  
  return quota || 10000; // Default to basic
}

function getTierForPrice(priceId?: string): string {
  // Map price IDs to tier names
  // IMPORTANT: Replace these placeholder IDs with actual Stripe price IDs from your dashboard
  const tierMap: Record<string, string> = {
    'price_basic': 'basic',
    'price_pro': 'pro',
    'price_premium': 'premium',
  };

  const tier = tierMap[priceId || ''];
  
  // Validate that price IDs have been configured
  if (!tier && priceId && !priceId.startsWith('price_')) {
    console.error(`Unknown price ID: ${priceId}. Please configure in getTierForPrice()`);
  }
  
  return tier || 'basic';
}