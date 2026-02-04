# Migration Guide: Adding @unique to Subscription.stripeSubscriptionId

## Overview

This document describes the safe migration process for adding a `@unique` constraint to the `Subscription.stripeSubscriptionId` field in the Prisma schema to prevent duplicate subscription records from Stripe webhooks.

## Prerequisites

Before running the migration:

1. **Backup your database** - Always create a full backup before schema changes
2. **Test on a staging/snapshot database first** - Never run deduplication on production without testing
3. **Ensure DATABASE_URL is properly set** - Required for Prisma Client connection

## Migration Checklist

### 1. Pre-Migration: Check for Duplicates

Run the duplicate check script to identify any existing duplicate `stripeSubscriptionId` values:

```bash
node scripts/check-duplicate-subscriptions.js
```

- **Exit code 0**: No duplicates found, safe to proceed to step 3
- **Exit code 2**: Duplicates detected, proceed to step 2

### 2. Deduplicate Existing Data (if needed)

If duplicates are found, run the deduplication script:

```bash
node scripts/dedupe-subscriptions.js
```

**What this script does:**
- Finds all duplicate `stripeSubscriptionId` entries
- For each duplicate set:
  - Keeps the record with the latest `currentPeriodEnd` as canonical
  - Merges `used` and `quota` values (takes maximum of both)
  - Deletes all other duplicate records
- Preserves the most recent subscription state

**After running:**
- Review the console output to verify expected behavior
- Re-run the check script to confirm all duplicates are resolved

### 3. Generate and Review Prisma Migration

Update your `schema.prisma` file to add the `@unique` constraint:

```prisma
model Subscription {
  id                    String    @id @default(cuid())
  userId                String
  stripeSubscriptionId  String    @unique  // <- Add this
  tier                  String
  quota                 Int
  used                  Int       @default(0)
  status                String
  currentPeriodEnd      DateTime
}
```

Generate the migration:

```bash
npx prisma migrate dev --name add-unique-stripe-subscription-id
```

Review the generated SQL migration file to ensure it only adds the constraint.

### 4. Apply Migration to Production

**Recommended approach for zero-downtime:**

1. Deploy webhook safety helpers first (from this PR)
2. Run dedupe script on production during low-traffic window
3. Verify no duplicates: `node scripts/check-duplicate-subscriptions.js`
4. Apply Prisma migration: `npx prisma migrate deploy`
5. Monitor webhook processing for 24-48 hours

**High-traffic considerations:**
- Consider using a database transaction
- Set a maintenance window if possible
- Have rollback plan ready (see below)

### 5. Post-Migration Verification

After migration:

1. Check that the constraint exists:
   ```sql
   SELECT constraint_name, constraint_type 
   FROM information_schema.table_constraints 
   WHERE table_name = 'Subscription' 
   AND constraint_type = 'UNIQUE';
   ```

2. Monitor application logs for any subscription-related errors
3. Test webhook processing in staging/production

## Rollback Procedure

If issues arise after migration:

### Option 1: Remove the Unique Constraint (Fastest)

If the constraint is causing issues but data is intact:

```sql
ALTER TABLE "Subscription" 
DROP CONSTRAINT "Subscription_stripeSubscriptionId_key";
```

Then revert the schema change in your code and generate a new migration.

### Option 2: Full Database Rollback

If data corruption occurred:

1. Stop the application
2. Restore from the pre-migration backup
3. Revert code changes
4. Restart application
5. Investigate root cause before retrying

## Continuous Integration

The `.github/workflows/premerge-duplicate-check.yml` workflow runs automatically on PRs to `main` to ensure no duplicates are introduced before merging schema changes.

**Note**: This check requires `DATABASE_URL` to be set as a GitHub secret.

## Webhook Safety Improvements

This PR also includes helper functions in `lib/stripeHelpers.ts` that safely parse Stripe webhook data:

- `getSubscriptionCurrentPeriodEnd(subscription)` - Safely extracts `current_period_end` across API versions
- `getInvoiceSubscriptionId(invoice)` - Safely extracts subscription ID from invoice (handles both string and object)

These helpers prevent type errors when Stripe changes webhook payload structures.

## Troubleshooting

### "Duplicate stripeSubscriptionId entries detected"

**Cause**: Multiple Subscription records share the same `stripeSubscriptionId`

**Solution**: Run `scripts/dedupe-subscriptions.js` to merge duplicates

### "Unique constraint violation" errors in logs

**Cause**: Webhook tried to create a subscription that already exists

**Solution**: 
1. Verify the deduplication script ran successfully
2. Check that webhook handler uses `upsert` (not `create`)
3. Review recent webhook payloads for anomalies

### Migration fails with "violates unique constraint"

**Cause**: Duplicates still exist in the database

**Solution**:
1. Rollback the migration attempt
2. Run the check script to identify remaining duplicates
3. Manually investigate and resolve edge cases
4. Re-run deduplication script
5. Retry migration

## Support

For issues or questions:
1. Check application logs for specific error messages
2. Review Stripe webhook logs in dashboard
3. Verify database state with SQL queries
4. Consult with the team before production changes

## Related Files

- `scripts/dedupe-subscriptions.js` - Deduplication script
- `scripts/check-duplicate-subscriptions.js` - Duplicate detection script
- `lib/stripeHelpers.ts` - Webhook parsing helpers
- `pages/api/stripe/webhook.ts` - Webhook handler with safety improvements
- `.github/workflows/premerge-duplicate-check.yml` - CI check for duplicates
