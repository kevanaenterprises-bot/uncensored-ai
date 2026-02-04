# Migration Guide: Adding Unique Constraint to stripeSubscriptionId

This document describes the process for safely adding a unique constraint to the `Subscription.stripeSubscriptionId` field.

## Overview

The `stripeSubscriptionId` field in the `Subscription` table should have a unique constraint to prevent duplicate entries. However, applying this constraint directly may fail if duplicate entries already exist in the database.

## Prerequisites

- Database backup (mandatory)
- Access to a staging environment with production data snapshot
- Node.js and npm installed
- Prisma CLI available

## Migration Steps

### 1. Pre-Migration: Check for Duplicates

Before applying the migration, check if there are any duplicate `stripeSubscriptionId` entries:

```bash
node scripts/check-duplicate-subscriptions.js
```

If this exits with code 0, you can proceed directly to step 3. If it exits with code 2, continue to step 2.

### 2. Deduplicate Existing Data

If duplicates are found, run the dedupe script **against a staging database snapshot** first to review the results:

```bash
# Set DATABASE_URL to point to your staging database
export DATABASE_URL="postgresql://user:password@staging-host:5432/dbname"

# Run the dedupe script
node scripts/dedupe-subscriptions.js
```

**Merge Strategy:**
- The script keeps the subscription with the latest `currentPeriodEnd` as the canonical record
- `used` and `quota` are set to the maximum values across all duplicates
- Other fields (`tier`, `status`, `currentPeriodEnd`) are taken from the canonical record
- Duplicate records are deleted

**Review the output carefully** before running against production.

Once satisfied with the staging results, run the script against production:

```bash
# Set DATABASE_URL to point to your production database
export DATABASE_URL="postgresql://user:password@prod-host:5432/dbname"

# Run the dedupe script
node scripts/dedupe-subscriptions.js
```

Verify that all duplicates are resolved:

```bash
node scripts/check-duplicate-subscriptions.js
```

### 3. Update Prisma Schema

Add the `@unique` constraint to the schema:

```prisma
model Subscription {
  id                    String    @id @default(cuid())
  userId                String
  stripeSubscriptionId  String    @unique  // Add this constraint
  tier                  String
  quota                 Int
  used                  Int       @default(0)
  status                String
  currentPeriodEnd      DateTime
}
```

### 4. Generate and Apply Migration

Generate the migration:

```bash
npx prisma migrate dev --name add-unique-stripeSubscriptionId
```

For production deployment:

```bash
npx prisma migrate deploy
```

### 5. Verify Migration

After applying the migration, verify that:
1. The unique constraint is in place
2. The application can create new subscriptions
3. Webhook handling works correctly

## CI/CD Integration

A GitHub Actions workflow (`premerge-duplicate-check.yml`) runs on all PRs to main and checks for duplicate `stripeSubscriptionId` entries. This prevents merging code changes while duplicates exist.

## Rollback

If you need to rollback the unique constraint:

1. Create a new migration that removes the constraint:

```bash
npx prisma migrate dev --name remove-unique-stripeSubscriptionId
```

2. Update the schema to remove `@unique`:

```prisma
model Subscription {
  id                    String    @id @default(cuid())
  userId                String
  stripeSubscriptionId  String    // Constraint removed
  tier                  String
  quota                 Int
  used                  Int       @default(0)
  status                String
  currentPeriodEnd      DateTime
}
```

3. Apply the rollback migration:

```bash
npx prisma migrate deploy
```

## Webhook Safety Improvements

This migration also includes helper functions in `lib/stripeHelpers.ts` to safely parse Stripe webhook payloads:

- `getSubscriptionCurrentPeriodEnd(subscription)`: Normalizes `current_period_end` field across different Stripe API versions
- `getInvoiceSubscriptionId(invoice)`: Safely extracts subscription ID from invoice objects

These helpers are used in `pages/api/stripe/webhook.ts` to prevent parsing errors that could lead to duplicate subscription records.

## Support

If you encounter issues during migration:
1. Check database logs for constraint violation errors
2. Re-run the duplicate check script
3. Review the dedupe script output for any anomalies
4. Ensure DATABASE_URL is correctly set

For questions or issues, contact the development team.
