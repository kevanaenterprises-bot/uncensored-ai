# Migration Guide: Making stripeSubscriptionId Unique

## Overview

This guide provides step-by-step instructions for adding a unique constraint to the `Subscription.stripeSubscriptionId` field in your database. Following this guide will ensure data integrity and prevent duplicate subscription entries from Stripe webhooks.

## Prerequisites

- Access to production database (read/write)
- Ability to run Node.js scripts
- Database backup completed and verified

## Pre-Migration Checklist

- [ ] **Create a database backup**
  ```bash
  # Example for PostgreSQL
  pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] **Verify backup integrity**
  ```bash
  # Check that backup file exists and is not empty
  ls -lh backup_*.sql
  ```

- [ ] **Test scripts on a snapshot/staging database first**
  ```bash
  # Point to staging database
  export DATABASE_URL="postgresql://..."
  node scripts/check-duplicate-subscriptions.js
  ```

## Migration Steps

### Step 1: Check for Existing Duplicates

Run the duplicate check script to identify if any duplicates exist:

```bash
node scripts/check-duplicate-subscriptions.js
```

**Expected outcomes:**
- Exit code 0: No duplicates found → Proceed to Step 3
- Exit code 2: Duplicates found → Proceed to Step 2

### Step 2: Deduplicate Existing Data (if needed)

If duplicates were found in Step 1, run the deduplication script:

```bash
node scripts/dedupe-subscriptions.js
```

**What this script does:**
- Identifies all duplicate `stripeSubscriptionId` entries
- For each duplicate group:
  - Keeps the subscription with the latest `currentPeriodEnd`
  - Merges `used` and `quota` by taking the maximum values
  - Deletes all other duplicate entries

**After running:**
- Re-run the check script to confirm all duplicates are resolved:
  ```bash
  node scripts/check-duplicate-subscriptions.js
  ```

### Step 3: Apply Database Migration

Once no duplicates exist, apply the unique constraint to the schema:

```bash
# Update prisma/schema.prisma
# Change:
#   stripeSubscriptionId   String
# To:
#   stripeSubscriptionId   String    @unique

# Generate and apply migration
npx prisma migrate dev --name add-unique-constraint-stripe-subscription-id
```

### Step 4: Verify Migration

Confirm the unique constraint is in place:

```bash
# Check PostgreSQL directly
psql $DATABASE_URL -c "\d \"Subscription\""
# Look for a unique index on stripeSubscriptionId

# Or use Prisma
npx prisma db pull
# Verify the schema.prisma shows @unique on stripeSubscriptionId
```

### Step 5: Deploy Updated Application

Deploy the updated application code that includes:
- Helper functions from `lib/stripeHelpers.ts`
- Updated webhook handler in `pages/api/stripe/webhook.ts`

```bash
# Build and deploy
npm run build
# Deploy using your deployment process (Vercel, Docker, etc.)
```

## Post-Migration Validation

- [ ] **Test webhook processing**
  - Trigger a test webhook from Stripe Dashboard
  - Verify subscription is created/updated correctly
  - Check logs for any errors

- [ ] **Monitor production logs**
  - Watch for duplicate key violations
  - Check for any Stripe webhook failures

- [ ] **Verify data integrity**
  ```bash
  # Run the check again to ensure no new duplicates
  node scripts/check-duplicate-subscriptions.js
  ```

## Rollback Procedure

If issues occur after migration, follow these steps to rollback:

### Immediate Rollback (Application Level)

1. **Revert application code** to previous version without the helpers:
   ```bash
   git revert <commit-hash>
   git push
   # Redeploy previous version
   ```

2. **Monitor** - Check if webhooks are processing correctly

### Database Rollback (if constraint causes issues)

1. **Remove the unique constraint**:
   ```sql
   ALTER TABLE "Subscription" DROP CONSTRAINT IF EXISTS "Subscription_stripeSubscriptionId_key";
   ```

2. **Revert Prisma schema**:
   ```bash
   # Remove @unique from stripeSubscriptionId in schema.prisma
   npx prisma generate
   ```

3. **Restore from backup** (if data corruption occurred):
   ```bash
   # Stop application first to prevent writes
   psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
   ```

## Troubleshooting

### Issue: Migration fails with duplicate key error

**Solution:** Re-run the deduplication script:
```bash
node scripts/dedupe-subscriptions.js
node scripts/check-duplicate-subscriptions.js
```

### Issue: Webhooks fail after migration

**Symptoms:** Logs show constraint violations or duplicate key errors

**Solution:**
1. Check if duplicate webhooks are being received (Stripe retry behavior)
2. Verify webhook idempotency
3. Review the `stripeHelpers.ts` functions for correct field extraction

### Issue: Missing subscriptions after dedupe

**Solution:**
1. Check deduplication logs for which records were removed
2. Restore from backup if necessary
3. Manually verify Stripe dashboard for correct subscription state

## CI/CD Integration

The pre-merge duplicate check workflow (`.github/workflows/premerge-duplicate-check.yml`) will:
- Run automatically on all PRs targeting `main`
- Fail the PR if duplicates are detected
- Require `DATABASE_URL` secret to be configured in repository settings

**To configure:**
1. Go to repository Settings → Secrets and variables → Actions
2. Add `DATABASE_URL` secret with production database connection string
3. Ensure the database user has read access to the `Subscription` table

## Safety Notes

⚠️ **Important Considerations:**

1. **Always test on staging first** - Never run deduplication scripts directly on production without testing
2. **Backup before migration** - Ensure you can restore to the previous state
3. **Low-traffic window** - Schedule migration during off-peak hours to minimize impact
4. **Monitor closely** - Watch logs and metrics for at least 24 hours after migration
5. **Webhook retries** - Stripe will retry failed webhooks, so temporary errors may resolve automatically

## Success Criteria

Migration is successful when:
- ✅ No duplicate `stripeSubscriptionId` entries exist
- ✅ Unique constraint is in place
- ✅ Webhooks process correctly
- ✅ No constraint violations in logs
- ✅ CI check passes on new PRs
- ✅ All existing subscriptions are accessible and functional

## Support

If you encounter issues not covered in this guide:
1. Check application and database logs
2. Review Stripe webhook event logs in Dashboard
3. Consult with database administrator
4. Reach out to development team

---

**Last Updated:** 2026-02-04
**Version:** 1.0
