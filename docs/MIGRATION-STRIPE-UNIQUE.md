# Migration Checklist: Adding Unique Constraint to stripeSubscriptionId

This document outlines the safe migration process for adding a uniqueness constraint on `Subscription.stripeSubscriptionId`.

## Pre-Migration Steps

### 1. Backup Production Database
- [ ] Create a full database backup
- [ ] Verify backup integrity
- [ ] Store backup in secure location

### 2. Check for Duplicate Data
- [ ] Run duplicate check script on production:
  ```bash
  node scripts/check-duplicate-subscriptions.js
  ```
- [ ] If duplicates found, proceed to deduplication step
- [ ] If no duplicates, skip to migration step

### 3. Deduplicate Data (if needed)
- [ ] **CRITICAL**: Test deduplication script on a database snapshot first
- [ ] Review the merge strategy in `scripts/dedupe-subscriptions.js`:
  - Keeps subscription with latest `currentPeriodEnd`
  - Merges `used` and `quota` values (takes max of both)
- [ ] Run deduplication on production:
  ```bash
  node scripts/dedupe-subscriptions.js
  ```
- [ ] Verify deduplication:
  ```bash
  node scripts/check-duplicate-subscriptions.js
  ```

## Migration Steps

### 4. Update Webhook Handlers
- [ ] Deploy updated `pages/api/stripe/webhook.ts` with new helpers
- [ ] Verify webhook handlers are working correctly
- [ ] Monitor error logs for any issues

### 5. Create and Apply Migration
- [ ] Create Prisma migration to add unique constraint:
  ```bash
  npx prisma migrate dev --name add-stripe-subscription-id-unique
  ```
- [ ] Review generated migration file
- [ ] Test migration on staging environment
- [ ] Apply migration to production:
  ```bash
  npx prisma migrate deploy
  ```

### 6. Verify Migration
- [ ] Check that unique constraint is active:
  ```sql
  SELECT * FROM pg_indexes WHERE tablename = 'Subscription';
  ```
- [ ] Test webhook endpoints with test Stripe events
- [ ] Monitor application logs for errors

## Post-Migration Monitoring

### 7. Monitor for Issues
- [ ] Monitor webhook error rates for 24-48 hours
- [ ] Check for any duplicate subscription creation attempts
- [ ] Review database logs for constraint violations
- [ ] Verify CI/CD pipeline includes duplicate check

## Rollback Plan

If issues arise:
1. Remove unique constraint:
   ```sql
   ALTER TABLE "Subscription" DROP CONSTRAINT IF EXISTS "Subscription_stripeSubscriptionId_key";
   ```
2. Investigate root cause
3. Fix underlying issue
4. Repeat migration process

## Additional Notes

- The pre-merge GitHub Actions workflow will automatically check for duplicates on all PRs
- Any constraint violations should be investigated immediately
- Keep the deduplication script for future reference
- Document any customizations to the merge strategy
