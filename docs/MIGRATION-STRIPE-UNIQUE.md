# Migration Instructions: Adding @unique to Subscription.stripeSubscriptionId

This document provides step-by-step instructions for safely migrating the database schema to add a unique constraint on `Subscription.stripeSubscriptionId`.

## Problem

Currently, the `Subscription` model allows duplicate `stripeSubscriptionId` values in the database. This can cause issues with webhook processing and subscription management. We need to add a `@unique` constraint, but this migration will fail if duplicate entries exist.

## Solution

We provide two scripts and a GitHub Actions workflow to ensure safe migration:

1. **scripts/dedupe-subscriptions.js** - Finds and merges duplicate subscriptions
2. **scripts/check-duplicate-subscriptions.js** - Validates no duplicates exist
3. **GitHub Actions Pre-merge Check** - Prevents merging PRs if duplicates exist in the connected database

## Pre-Migration Steps

### Step 1: Backup Your Database

**CRITICAL:** Always backup your production database before running any migration:

```bash
# For PostgreSQL
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# Or use your cloud provider's backup tools
```

### Step 2: Test on Staging First

1. Create a staging database from a production snapshot
2. Set `DATABASE_URL` to point to the staging database
3. Run the dedupe script

```bash
# Set DATABASE_URL in .env or export it
export DATABASE_URL="postgresql://user:pass@staging-host:5432/dbname"

# Run the dedupe script
node scripts/dedupe-subscriptions.js
```

### Step 3: Review Results

The dedupe script will:
- Find all duplicate `stripeSubscriptionId` entries
- Keep the subscription with the latest `currentPeriodEnd` as canonical
- Merge `used` and `quota` values (taking the maximum of each)
- Delete duplicate entries

Review the console output to understand what changes will be made.

### Step 4: Verify No Duplicates Remain

```bash
node scripts/check-duplicate-subscriptions.js
```

This should exit with code 0 and print "No duplicate stripeSubscriptionId entries found."

## Schema Migration

Once duplicates are resolved, update the Prisma schema and generate the migration:

### Step 1: Update schema.prisma

Add `@unique` to the `stripeSubscriptionId` field:

```prisma
model Subscription {
  id                    String    @id @default(cuid())
  userId                String
  stripeSubscriptionId   String    @unique  // <- Add @unique here
  tier                  String
  quota                 Int
  used                  Int       @default(0)
  status                String
  currentPeriodEnd      DateTime
}
```

### Step 2: Generate Migration

```bash
# For development
npx prisma migrate dev --name add-unique-stripeSubscriptionId

# For production
npx prisma migrate deploy
```

## Production Deployment Checklist

- [ ] Backup production database
- [ ] Test dedupe script on staging database snapshot
- [ ] Verify no duplicates remain on staging
- [ ] Schedule maintenance window (optional, but recommended)
- [ ] Run dedupe script on production database
- [ ] Verify no duplicates remain on production
- [ ] Deploy schema migration
- [ ] Verify application health
- [ ] Monitor error logs for 24 hours

## Rollback Procedure

If issues occur after migration, you can rollback:

### Option 1: Database Restore (Safest)

Restore from the backup taken before migration:

```bash
# For PostgreSQL
psql $DATABASE_URL < backup-YYYYMMDD-HHMMSS.sql
```

### Option 2: Remove Unique Constraint

If you can't restore from backup, remove the unique constraint:

1. Edit `schema.prisma` and remove `@unique` from `stripeSubscriptionId`
2. Generate a new migration:

```bash
npx prisma migrate dev --name remove-unique-stripeSubscriptionId
```

3. Deploy the migration:

```bash
npx prisma migrate deploy
```

## Merge Strategy Details

The dedupe script uses the following merge strategy:

- **Canonical Record**: The subscription with the latest `currentPeriodEnd` is kept
- **Used Tokens**: `used = max(used)` across all duplicates
- **Quota**: `quota = max(quota)` across all duplicates
- **Other Fields**: Taken from the canonical record

This conservative approach ensures no usage data is lost.

## GitHub Actions Integration

The repository now includes a pre-merge check that runs on all PRs to `main`:

- Workflow: `.github/workflows/premerge-duplicate-check.yml`
- Runs: `scripts/check-duplicate-subscriptions.js`
- Requires: `DATABASE_URL` secret to be configured in repository settings

If duplicates are detected, the PR will fail CI and must not be merged until duplicates are resolved.

## Support

If you encounter issues during migration:

1. Check that `DATABASE_URL` is correctly configured
2. Verify Prisma client is up to date: `npm install @prisma/client@latest`
3. Review error logs from the dedupe script
4. If needed, restore from backup and retry

## Webhook Safety Improvements

This PR also includes new helper functions in `lib/stripeHelpers.ts` to safely parse Stripe webhook data:

- `getSubscriptionCurrentPeriodEnd(subscription)` - Safely extract period end timestamp
- `getInvoiceSubscriptionId(invoice)` - Safely extract subscription ID from invoice

These helpers normalize different Stripe API versions and webhook payload formats, preventing crashes from unexpected data structures.
