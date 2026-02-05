lib/stripeHelpers.ts
v6
// lib/stripeHelpers.ts
// Small helpers to safely read Stripe fields that vary across API versions.

export function getSubscriptionCurrentPeriodEnd(subscription: any): number {
  // Normalize different possible field names and formats.
  // Some Stripe versions may include `current_period_end` as number or string.
