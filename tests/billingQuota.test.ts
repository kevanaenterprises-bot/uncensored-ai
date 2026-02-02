// tests/billingQuota.test.ts

import { checkQuota, updateUsage, resetQuota, Subscription } from '../lib/billingQuota';

describe('Billing Quota Tests', () => {
  const mockSubscription: Subscription = {
    id: 'sub_123',
    userId: 'user_123',
    stripeSubscriptionId: 'stripe_sub_123',
    tier: 'premium',
    quota: 1000,
    used: 200,
    status: 'active',
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  };

  describe('checkQuota', () => {
    test('should allow request when quota is sufficient', () => {
      const result = checkQuota(mockSubscription, 100);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(700);
      expect(result.message).toBeUndefined();
    });

    test('should deny request when quota is insufficient', () => {
      const result = checkQuota(mockSubscription, 1000);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(800);
      expect(result.message).toContain('Insufficient quota');
    });

    test('should deny request when subscription is null', () => {
      const result = checkQuota(null, 100);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.message).toBe('No active subscription found');
    });

    test('should deny request when subscription is inactive', () => {
      const inactiveSub = { ...mockSubscription, status: 'canceled' };
      const result = checkQuota(inactiveSub, 100);
      expect(result.allowed).toBe(false);
      expect(result.message).toContain('canceled');
    });

    test('should deny request when subscription period has ended', () => {
      const expiredSub = {
        ...mockSubscription,
        currentPeriodEnd: new Date(Date.now() - 1000), // 1 second ago
      };
      const result = checkQuota(expiredSub, 100);
      expect(result.allowed).toBe(false);
      expect(result.message).toBe('Subscription period has ended');
    });

    test('should allow request when tokens required exactly matches remaining quota', () => {
      const result = checkQuota(mockSubscription, 800);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);
    });
  });

  describe('updateUsage', () => {
    test('should correctly update subscription usage', () => {
      const updated = updateUsage(mockSubscription, 100);
      expect(updated.used).toBe(300);
      expect(updated.quota).toBe(1000);
    });

    test('should accumulate usage across multiple updates', () => {
      let updated = updateUsage(mockSubscription, 100);
      updated = updateUsage(updated, 50);
      updated = updateUsage(updated, 25);
      expect(updated.used).toBe(375);
    });
  });

  describe('resetQuota', () => {
    test('should reset usage to zero', () => {
      const newPeriodEnd = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
      const reset = resetQuota(mockSubscription, newPeriodEnd);
      expect(reset.used).toBe(0);
      expect(reset.currentPeriodEnd).toBe(newPeriodEnd);
    });

    test('should maintain other subscription properties', () => {
      const newPeriodEnd = new Date();
      const reset = resetQuota(mockSubscription, newPeriodEnd);
      expect(reset.id).toBe(mockSubscription.id);
      expect(reset.userId).toBe(mockSubscription.userId);
      expect(reset.quota).toBe(mockSubscription.quota);
      expect(reset.tier).toBe(mockSubscription.tier);
    });
  });
});