# Migration Guide: Adding @unique Constraint to Subscription.stripeSubscriptionId

This guide outlines the safe migration process for adding a `@unique` constraint to the `Subscription.stripeSubscriptionId` field in the Prisma schema.

## Overview

Adding a unique constraint to `stripeSubscriptionId` prevents duplicate subscription entries that can occur due to webhook race conditions or replay attacks. However, if duplicate entries already exist in the database, the migration will fail.

## Pre-Migration Checklist

### 1. Backup Your Database
```bash
# Create a backup before proceeding
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Check for Existing Duplicates (Production/Staging)
```bash
# Set DATABASE_URL to your target environment
export DATABASE_URL="postgresql://..."

# Run the duplicate check script
node scripts/check-duplicate-subscriptions.js
```

**Exit codes:**
- `0` - No duplicates found, safe to proceed
- `2` - Duplicates detected, run dedupe script
- `1` - Script error, check logs

### 3. Deduplicate if Necessary
If duplicates are found:

```bash
# Review the script first - it will delete duplicate records
# Run against staging/snapshot first to test
node scripts/dedupe-subscriptions.js
```

**Deduplication Strategy:**
- Keeps the subscription with the latest `currentPeriodEnd`
- Merges `used` and `quota` by taking max values
- Deletes older duplicate entries

### 4. Verify Clean State
```bash
# Re-run the check to confirm no duplicates remain
node scripts/check-duplicate-subscriptions.js
```

### 5. Update Schema and Generate Migration
Once duplicates are resolved:

```prisma
model Subscription {
  id                    String    @id @default(cuid())
  userId                String
  stripeSubscriptionId  String    @unique  // <- Add @unique constraint
  tier                  String
  quota                 Int
  used                  Int       @default(0)
  status                String
  currentPeriodEnd      DateTime
}
```

Generate and apply the migration:
```bash
npx prisma migrate dev --name add-unique-constraint-to-stripe-subscription-id
npx prisma migrate deploy  # For production
```

## Testing

After migration:
1. Verify the unique constraint is active:
```sql
\d "Subscription"  -- Check for unique index
```

2. Test webhook handlers with the new constraint
3. Monitor for any constraint violation errors in production logs

## Rollback Procedure

If issues occur after migration:

### Option 1: Remove Unique Constraint (Quick)
```sql
-- Remove the unique constraint
ALTER TABLE "Subscription" DROP CONSTRAINT IF EXISTS "Subscription_stripeSubscriptionId_key";
```

### Option 2: Rollback Migration (Complete)
```bash
# Revert to previous migration
npx prisma migrate resolve --rolled-back <migration-name>

# Restore from backup if data was lost
psql $DATABASE_URL < backup_<timestamp>.sql
```

## Monitoring

After deployment, monitor for:
- Webhook failures related to duplicate key violations
- Subscription creation/update errors
- Logs containing "duplicate key value violates unique constraint"

## Pre-Merge CI Check

The GitHub Actions workflow `.github/workflows/premerge-duplicate-check.yml` automatically runs on PRs to `main` branch to catch duplicate entries before merging schema changes.

**If CI check fails:**
1. Coordinate with team to pause new subscriptions temporarily (if possible)
2. Run dedupe script on production
3. Verify duplicates are resolved
4. Re-run CI check

## Additional Notes

- The `lib/stripeHelpers.ts` provides safety helpers for parsing Stripe webhook fields that may vary across API versions
- Always test the dedupe script on a database snapshot before running on production
- Consider implementing idempotency keys in webhook handlers to prevent future duplicates
- The pre-merge check requires `DATABASE_URL` secret to be configured in GitHub repository secrets

## Support

For issues or questions, refer to:
- Stripe webhook documentation: https://stripe.com/docs/webhooks
- Prisma migrations: https://www.prisma.io/docs/concepts/components/prisma-migrate
- Project maintainers via GitHub issues
