# Migration Guide: Adding Unique Constraint to Subscription.stripeSubscriptionId

This document outlines the safe migration process for adding a uniqueness constraint to the `stripeSubscriptionId` field in the `Subscription` table.

## Overview

The migration adds a unique constraint to prevent duplicate `stripeSubscriptionId` entries, which can occur if webhook events are processed multiple times or if there are race conditions during subscription creation.

## Pre-Migration Steps

### 1. Backup Your Database

**CRITICAL**: Always backup your production database before running any migration.

```bash
# Example for PostgreSQL
pg_dump -h localhost -U postgres -d your_database > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Test on a Staging Database Snapshot

Create a snapshot of your production database and test the entire process on staging:

```bash
# Set DATABASE_URL to point to your staging database
export DATABASE_URL="postgresql://user:password@staging-host:5432/staging_db"
```

### 3. Run the Deduplication Script

Before applying the schema migration, run the deduplication script to find and merge any existing duplicates:

```bash
node scripts/dedupe-subscriptions.js
```

**What this script does:**
- Scans for duplicate `stripeSubscriptionId` entries
- For each duplicate set:
  - Keeps the subscription with the latest `currentPeriodEnd` as canonical
  - Merges `used` and `quota` values (takes maximum of each)
  - Deletes all duplicate entries

### 4. Verify No Duplicates Remain

Run the duplicate check script to confirm:

```bash
node scripts/check-duplicate-subscriptions.js
```

This script exits with code 0 if no duplicates exist, or code 2 if duplicates are found.

## Migration Steps

### Development Environment

```bash
npx prisma migrate dev --name add-unique-stripeSubscriptionId
```

This will:
1. Generate the migration SQL
2. Apply it to your development database
3. Regenerate the Prisma Client

### Production Environment

```bash
npx prisma migrate deploy
```

This applies pending migrations to your production database.

## Schema Change

The migration adds the following constraint:

```prisma
model Subscription {
  id                    String    @id @default(cuid())
  userId                String
  stripeSubscriptionId   String    @unique  // <-- Added unique constraint
  tier                  String
  quota                 Int
  used                  Int       @default(0)
  status                String
  currentPeriodEnd      DateTime
}
```

## Post-Migration Verification

### 1. Verify Constraint is Active

```sql
-- Check constraint exists
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'Subscription' 
  AND constraint_type = 'UNIQUE';
```

### 2. Test Webhook Safety

The updated webhook handler now uses safe helper functions:
- `getSubscriptionCurrentPeriodEnd()` - Normalizes various formats of period end timestamps
- `getInvoiceSubscriptionId()` - Safely extracts subscription ID from invoice objects

### 3. Monitor Application Logs

Watch for any errors related to duplicate key violations after deployment.

## Continuous Integration

The `.github/workflows/premerge-duplicate-check.yml` workflow automatically runs on every PR to `main` and checks for duplicate entries before merging. This prevents new duplicates from being introduced.

## Rollback Procedure

If you need to rollback the migration:

### 1. Remove the Unique Constraint

```sql
-- Find the constraint name
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'Subscription' 
  AND constraint_type = 'UNIQUE'
  AND constraint_name LIKE '%stripeSubscriptionId%';

-- Drop the constraint (replace constraint_name with actual name)
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_stripeSubscriptionId_key";
```

### 2. Revert Schema File

```bash
git revert <commit-hash>
npx prisma db pull  # Pull current schema from database
npx prisma generate  # Regenerate client
```

### 3. Restore from Backup (if needed)

```bash
# Example for PostgreSQL
psql -h localhost -U postgres -d your_database < backup_file.sql
```

## Preventing Future Duplicates

The webhook handler improvements ensure:

1. **Idempotent upsert operations**: Using `stripeSubscriptionId` as the unique key
2. **Safe field extraction**: Helper functions handle various Stripe API versions
3. **Proper timestamp conversion**: Normalizes timestamp formats before database operations

## Troubleshooting

### Duplicate Key Violation After Migration

If you see errors like `duplicate key value violates unique constraint`:

1. A duplicate was created after the initial dedupe but before the migration
2. Run the dedupe script again:
   ```bash
   node scripts/dedupe-subscriptions.js
   ```

### Script Fails to Connect to Database

Ensure `DATABASE_URL` environment variable is set:
```bash
export DATABASE_URL="postgresql://user:password@host:5432/database"
```

Or create a `.env` file:
```env
DATABASE_URL="postgresql://user:password@host:5432/database"
```

## Support

For issues or questions:
1. Check application logs for error details
2. Verify database connection and credentials
3. Review the deduplication script output
4. Contact the development team with specific error messages

## References

- [Prisma Migrations Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Stripe Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [PostgreSQL Unique Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-UNIQUE-CONSTRAINTS)
