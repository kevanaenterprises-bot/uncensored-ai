# Deployment Guide

This guide covers deploying the Next.js application using Docker, GitHub Container Registry (GHCR), Railway, or Vercel.

## Table of Contents

1. [Docker Deployment](#docker-deployment)
2. [GitHub Container Registry (GHCR)](#github-container-registry-ghcr)
3. [Railway Deployment](#railway-deployment)
4. [Vercel Deployment](#vercel-deployment-optional)
5. [Environment Variables](#environment-variables)
6. [Database Migrations](#database-migrations)
7. [CI/CD and Automatic Releases](#cicd-and-automatic-releases)

## Docker Deployment

### Building Locally

Build the production Docker image locally:

```bash
npm run docker:build
# or
docker build -t uncensored-ai .
```

### Running with Docker

Run the Docker container with required environment variables:

```bash
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@host:5432/database" \
  -e NEXTAUTH_SECRET="your-secret-here" \
  -e NEXTAUTH_URL="https://your-domain.com" \
  -e OPENAI_API_KEY="sk-..." \
  -e STRIPE_SECRET_KEY="sk_live_..." \
  -e STRIPE_WEBHOOK_SECRET="whsec_..." \
  -e NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..." \
  -e ADMIN_EMAIL="admin@example.com" \
  -e ADMIN_PASSWORD="secure-password" \
  --name uncensored-ai \
  uncensored-ai:latest
```

### Running with Docker Compose

Create a `docker-compose.prod.yml` file:

```yaml
version: '3.8'
services:
  app:
    image: uncensored-ai:latest
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
      - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
      - ADMIN_EMAIL=${ADMIN_EMAIL}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
    depends_on:
      - postgres
  
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=app
      - POSTGRES_PASSWORD=changeme
      - POSTGRES_DB=uncensored_ai
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Run with:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## GitHub Container Registry (GHCR)

### Automatic Publishing

The CI/CD pipeline automatically builds and publishes Docker images to GHCR when:
- Code is pushed to the `main` branch (tagged as `latest`)
- Tags matching `v*` are pushed (tagged with version number and commit SHA)

### No Extra Secrets Required

GHCR publishing uses the built-in `GITHUB_TOKEN` - no additional secrets needed!

### Pulling from GHCR

Pull the latest image:

```bash
docker pull ghcr.io/kevanaenterprises-bot/uncensored-ai:latest
```

Pull a specific version:

```bash
docker pull ghcr.io/kevanaenterprises-bot/uncensored-ai:v1.0.0
```

### Running from GHCR

```bash
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="..." \
  -e NEXTAUTH_URL="https://your-domain.com" \
  -e OPENAI_API_KEY="sk-..." \
  -e STRIPE_SECRET_KEY="sk_live_..." \
  -e STRIPE_WEBHOOK_SECRET="whsec_..." \
  -e NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..." \
  -e ADMIN_EMAIL="admin@example.com" \
  -e ADMIN_PASSWORD="secure-password" \
  --name uncensored-ai \
  ghcr.io/kevanaenterprises-bot/uncensored-ai:latest
```

### Private Registry Access

If you make the GHCR package private, authenticate first:

```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

## Railway Deployment

## Railway Deployment

### Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Stripe Account**: Set up at [stripe.com](https://stripe.com)
3. **OpenAI API Key**: Obtain from [platform.openai.com](https://platform.openai.com)
4. **PostgreSQL Database**: Railway provides this automatically

### Environment Variables

### Database
```
DATABASE_URL=postgresql://user:password@host:port/database
```

### NextAuth
```
NEXTAUTH_SECRET=<generate-with: openssl rand -base64 32>
NEXTAUTH_URL=https://your-app.railway.app
```

### OpenAI
```
OPENAI_API_KEY=sk-...
```

### Stripe
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Admin Account
```
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<secure-password>
```

### Optional: Redis
```
REDIS_URL=redis://...
```

## Stripe Setup

### 1. Create Products and Prices

In your Stripe Dashboard, create products for each tier:

**Basic Tier:**
- Product: "Basic Plan"
- Price: $9.99/month
- Copy the Price ID (e.g., `price_1234...`)

**Pro Tier:**
- Product: "Pro Plan"
- Price: $29.99/month
- Copy the Price ID

**Premium Tier:**
- Product: "Premium Plan"
- Price: $99.99/month
- Copy the Price ID

### 2. Update Price IDs

Edit `pages/api/stripe/webhook.ts` and update the `getQuotaForPrice` and `getTierForPrice` functions with your actual Stripe Price IDs:

```typescript
function getQuotaForPrice(priceId?: string): number {
  const quotaMap: Record<string, number> = {
    'price_YOUR_BASIC_ID': 10000,
    'price_YOUR_PRO_ID': 50000,
    'price_YOUR_PREMIUM_ID': 200000,
  };
  return quotaMap[priceId || ''] || 10000;
}

function getTierForPrice(priceId?: string): string {
  const tierMap: Record<string, string> = {
    'price_YOUR_BASIC_ID': 'basic',
    'price_YOUR_PRO_ID': 'pro',
    'price_YOUR_PREMIUM_ID': 'premium',
  };
  return tierMap[priceId || ''] || 'basic';
}
```

### 3. Configure Webhook

1. In Stripe Dashboard, go to **Developers → Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL: `https://your-app.railway.app/api/stripe/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
5. Copy the webhook signing secret and add it to your environment variables

## Deployment Steps

### 1. Connect Repository to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link your project
railway link

# Deploy
railway up
```

### 2. Initialize Database

After deployment, run Prisma migrations:

```bash
# Generate Prisma client
railway run npx prisma generate

# Run migrations
railway run npx prisma migrate deploy
```

### 3. Create Admin Account

Use the `/api/admin/create-admin` endpoint (implementation required) or manually insert into database:

```sql
INSERT INTO "User" (id, email, "emailVerified", "passwordHash", "isAdmin", "createdAt")
VALUES (
  'admin_id',
  'admin@example.com',
  NOW(),
  '<bcrypt-hash-of-password>',
  true,
  NOW()
);
```

Generate bcrypt hash:
```bash
node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
```

## Post-Deployment

### 1. Test Authentication
- Visit `/api/auth/signin`
- Login with admin credentials

### 2. Test Stripe Integration
- Create a test subscription
- Verify webhook receives events
- Check database for subscription records

### 3. Test AI Assistant
- Authenticate a user
- Send POST to `/api/assistant` with a prompt
- Verify quota is tracked correctly

## Monitoring

### Check Logs
```bash
railway logs
```

### Database Access
```bash
railway connect
```

## Security Checklist

- ✅ All secrets in environment variables (not in code)
- ✅ Stripe webhook signature verification enabled
- ✅ NextAuth secret is strong and random
- ✅ Admin password is secure
- ✅ HTTPS enabled (automatic with Railway)
- ✅ Database credentials are secure
- ✅ CORS properly configured (if needed)

## Troubleshooting

### Stripe Webhooks Not Working
- Verify webhook URL is correct and publicly accessible
- Check webhook signing secret matches environment variable
- Review Railway logs for errors

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check if migrations have been run
- Ensure Prisma client is generated

### Authentication Failures
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Ensure user exists in database with correct password hash

## Scaling Considerations

- **Database**: Upgrade Railway PostgreSQL plan as needed
- **API Rate Limits**: Implement Redis-based rate limiting
- **OpenAI Costs**: Monitor usage and set billing alerts
- **Caching**: Add Redis for session storage and caching

## Vercel Deployment (Optional)

### Quick Deploy

1. Push your code to GitHub
2. Visit [vercel.com](https://vercel.com)
3. Click "Import Project" and select your repository
4. Configure environment variables in Vercel dashboard
5. Deploy

### Vercel CLI Deployment

```bash
npm install -g vercel
vercel login
vercel
```

### Environment Variables in Vercel

Add all required environment variables in the Vercel dashboard under:
**Settings → Environment Variables**

## Environment Variables

### Required for All Deployments

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# NextAuth
NEXTAUTH_SECRET=<generate-with: openssl rand -base64 32>
NEXTAUTH_URL=https://your-app-url.com

# OpenAI
OPENAI_API_KEY=sk-...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Admin Account
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<secure-password>

# Optional: Redis (for caching and rate limiting)
REDIS_URL=redis://...
```

### Generating Secrets

Generate a secure NextAuth secret:
```bash
openssl rand -base64 32
```

Generate bcrypt password hash (for manual DB insert):
```bash
node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
```

## Database Migrations

### Running Migrations in Production

After deploying, run Prisma migrations to set up the database schema:

```bash
# For Railway
railway run npx prisma migrate deploy

# For Docker
docker exec uncensored-ai npx prisma migrate deploy

# For local Docker Compose
docker-compose exec app npx prisma migrate deploy
```

### Generate Prisma Client

The Prisma client is automatically generated during the build process via the `postinstall` script. If you need to regenerate it manually:

```bash
npx prisma generate
```

## CI/CD and Automatic Releases

### GitHub Actions Workflows

This project includes three GitHub Actions workflows:

#### 1. CI Workflow (`.github/workflows/ci.yml`)

Runs on every push and pull request to `main`:
- Sets up Node.js 20
- Installs dependencies with caching
- Runs linter
- Runs tests
- Builds the Next.js application
- Uploads build artifacts

**No secrets required** - runs automatically.

#### 2. GHCR Publish Workflow (`.github/workflows/publish-ghcr.yml`)

Runs on push to `main` and version tags:
- Builds multi-architecture Docker image (amd64, arm64)
- Pushes to GitHub Container Registry
- Tags images with:
  - `latest` (for main branch)
  - Version tags (for `v*` tags)
  - Commit SHA

**Authentication**: Uses built-in `GITHUB_TOKEN` - no extra secrets needed!

#### 3. Release Workflow (`.github/workflows/release.yml`)

Runs on push to `main`:
- Waits for tests and build to pass
- Analyzes commit messages using semantic-release
- Creates GitHub releases with changelog
- Automatically tags releases based on conventional commits

**No extra secrets required** - uses `GITHUB_TOKEN`.

### Triggering Releases

This project uses **semantic-release** with conventional commits:

#### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types that trigger releases:**
- `feat`: New feature → Minor version bump (1.x.0)
- `fix`: Bug fix → Patch version bump (1.0.x)
- `perf`: Performance improvement → Patch version bump
- `BREAKING CHANGE`: in footer → Major version bump (x.0.0)

**Types that don't trigger releases:**
- `chore`: Maintenance tasks
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `ci`: CI/CD changes

#### Examples

**Trigger patch release (1.0.1):**
```bash
git commit -m "fix: resolve authentication timeout issue"
git push origin main
```

**Trigger minor release (1.1.0):**
```bash
git commit -m "feat: add user profile dashboard"
git push origin main
```

**Trigger major release (2.0.0):**
```bash
git commit -m "feat: redesign API endpoints

BREAKING CHANGE: API endpoints now use /v2/ prefix"
git push origin main
```

### Manual Version Tagging

You can also manually create and push tags to trigger GHCR publishing:

```bash
# Create a version tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push the tag
git push origin v1.0.0
```

This will:
1. Trigger the GHCR publish workflow
2. Build and push Docker image with version tag
3. Tag image as `ghcr.io/kevanaenterprises-bot/uncensored-ai:v1.0.0`

### Viewing Published Images

Visit the GitHub Container Registry for your repository:
```
https://github.com/kevanaenterprises-bot/uncensored-ai/pkgs/container/uncensored-ai
```

### Optional: Additional Secrets

If you want to deploy to other platforms, add these optional secrets in **Settings → Secrets and variables → Actions**:

- `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` - for Docker Hub publishing
- `VERCEL_TOKEN` - for Vercel deployments
- Custom deployment tokens for other platforms

## Monitoring and Maintenance

### Check Application Logs

**Docker:**
```bash
docker logs uncensored-ai
docker logs -f uncensored-ai  # Follow logs
```

**Railway:**
```bash
railway logs
```

### Database Access

**Docker:**
```bash
docker exec -it <postgres-container> psql -U app -d uncensored_ai
```

**Railway:**
```bash
railway connect
```

### Health Checks

Access your application health endpoint (if implemented):
```bash
curl https://your-app.com/api/health
```

## Security Best Practices

- ✅ All secrets in environment variables (never in code)
- ✅ Stripe webhook signature verification enabled
- ✅ NextAuth secret is strong and randomly generated
- ✅ Admin password is secure and hashed with bcrypt
- ✅ HTTPS enabled (automatic with Railway/Vercel)
- ✅ Database credentials are secure
- ✅ Docker images run as non-root user
- ✅ CORS properly configured
- ✅ Dependencies regularly updated
- ✅ GHCR packages set to private (if needed)

## Troubleshooting

### Docker Build Failures

**Issue**: Build fails with "out of memory"
**Solution**: Increase Docker memory limit or use multi-stage build (already implemented)

**Issue**: Prisma client not found
**Solution**: Ensure `postinstall` script runs: `npm install` or `npm ci`

### GHCR Authentication Issues

**Issue**: Cannot pull from GHCR
**Solution**: Make package public or authenticate:
```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

### Stripe Webhooks Not Working

- Verify webhook URL is publicly accessible
- Check webhook signing secret matches environment variable
- Review application logs for errors
- Test webhook with Stripe CLI:
  ```bash
  stripe listen --forward-to localhost:3000/api/stripe/webhook
  ```

### Database Connection Issues

- Verify `DATABASE_URL` format and credentials
- Check if migrations have been run: `npx prisma migrate deploy`
- Ensure database is accessible from your deployment environment
- Test connection: `npx prisma db push`

### Authentication Failures

- Verify `NEXTAUTH_SECRET` is set and strong
- Check `NEXTAUTH_URL` matches your domain exactly
- Ensure user exists in database with correct password hash
- Clear browser cookies and try again

## Scaling Considerations

- **Database**: Upgrade PostgreSQL plan as user base grows
- **API Rate Limits**: Implement Redis-based rate limiting
- **OpenAI Costs**: Monitor usage and set billing alerts in OpenAI dashboard
- **Caching**: Add Redis for session storage and API response caching
- **Load Balancing**: Use multiple container instances behind a load balancer
- **CDN**: Use CDN for static assets (automatic with Vercel)

## Support and Contributions

For issues and questions:
1. Check this documentation first
2. Review [API Documentation](./API.md)
3. Check [Development Guide](./DEVELOPMENT.md)
4. Open an issue in the GitHub repository

---

**Last Updated**: 2026-02-02
