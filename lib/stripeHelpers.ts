// lib/stripeHelpers.ts
// Small helpers to safely read Stripe fields that vary across API versions.

export function getSubscriptionCurrentPeriodEnd(subscription: any): number {
  // Normalize different possible field names and formats.
  // Some Stripe versions may include `current_period_end` as number or string.
  const candidates = [
    subscription?.current_period_end,
    subscription?.currentPeriodEnd,
    subscription?.current_period_end_at,
    subscription?.current_period_end || 0,
  ];

  for (const c of candidates) {
    const n = Number(c ?? 0);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  return 0;
}

export function getInvoiceSubscriptionId(invoice: any): string | null {
  // Invoice.subscription can be string id or object (depending on webhook payload)
  if (!invoice) return null;
  if (typeof invoice.subscription === 'string') return invoice.subscription;
  if (invoice.subscription && typeof invoice.subscription === 'object') {
    return invoice.subscription.id ?? null;
  }
  return null;
}
