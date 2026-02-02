// pages/api/admin/override.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '../../../lib/prisma';

interface OverrideRequest {
  userId: string;
  action: 'increase_quota' | 'reset_quota' | 'extend_period';
  value?: number;
  periodDays?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin session
    const session = await getSession({ req });
    if (!session?.user?.isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { userId, action, value, periodDays } = req.body as OverrideRequest;

    if (!userId || !action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find user's active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
      },
      orderBy: {
        currentPeriodEnd: 'desc',
      },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription found for user' });
    }

    let updatedSubscription;

    switch (action) {
      case 'increase_quota':
        if (!value || value <= 0) {
          return res.status(400).json({ error: 'Invalid quota value' });
        }
        updatedSubscription = await prisma.subscription.update({
          where: { id: subscription.id },
          data: { quota: subscription.quota + value },
        });
        break;

      case 'reset_quota':
        updatedSubscription = await prisma.subscription.update({
          where: { id: subscription.id },
          data: { used: 0 },
        });
        break;

      case 'extend_period':
        if (!periodDays || periodDays <= 0) {
          return res.status(400).json({ error: 'Invalid period days' });
        }
        const newPeriodEnd = new Date(subscription.currentPeriodEnd);
        newPeriodEnd.setDate(newPeriodEnd.getDate() + periodDays);
        
        updatedSubscription = await prisma.subscription.update({
          where: { id: subscription.id },
          data: { currentPeriodEnd: newPeriodEnd },
        });
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    return res.status(200).json({
      success: true,
      subscription: updatedSubscription,
      message: `Successfully applied ${action} for user ${userId}`,
    });
  } catch (error) {
    console.error('Admin override error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}