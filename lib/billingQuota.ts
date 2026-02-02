// lib/billingQuota.ts

export interface Subscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  tier: string;
  quota: number;
  used: number;
  status: string;
  currentPeriodEnd: Date;
}

export interface QuotaCheckResult {
  allowed: boolean;
  remaining: number;
  message?: string;
}

/**
 * Check if a user has enough quota to make a request
 * @param subscription - The user's subscription
 * @param tokensRequired - Number of tokens required for the request
 * @returns QuotaCheckResult indicating if the request is allowed
 */
export function checkQuota(
  subscription: Subscription | null,
  tokensRequired: number
): QuotaCheckResult {
  if (!subscription) {
    return {
      allowed: false,
      remaining: 0,
      message: 'No active subscription found',
    };
  }

  if (subscription.status !== 'active') {
    return {
      allowed: false,
      remaining: 0,
      message: `Subscription is ${subscription.status}`,
    };
  }

  const now = new Date();
  if (subscription.currentPeriodEnd < now) {
    return {
      allowed: false,
      remaining: 0,
      message: 'Subscription period has ended',
    };
  }

  const remaining = subscription.quota - subscription.used;
  if (remaining < tokensRequired) {
    return {
      allowed: false,
      remaining,
      message: `Insufficient quota. Remaining: ${remaining}, Required: ${tokensRequired}`,
    };
  }

  return {
    allowed: true,
    remaining: remaining - tokensRequired,
  };
}

/**
 * Update subscription usage after a successful request
 * @param subscription - The user's subscription
 * @param tokensUsed - Number of tokens used in the request
 * @returns Updated subscription
 */
export function updateUsage(
  subscription: Subscription,
  tokensUsed: number
): Subscription {
  return {
    ...subscription,
    used: subscription.used + tokensUsed,
  };
}

/**
 * Reset subscription usage for a new billing period
 * @param subscription - The user's subscription
 * @param newPeriodEnd - New period end date
 * @returns Updated subscription
 */
export function resetQuota(
  subscription: Subscription,
  newPeriodEnd: Date
): Subscription {
  return {
    ...subscription,
    used: 0,
    currentPeriodEnd: newPeriodEnd,
  };
}
