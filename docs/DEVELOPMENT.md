# Development Setup Guide

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for local PostgreSQL)
- Git

## Initial Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd uncensored-ai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Local Services

Start PostgreSQL and Redis using Docker Compose:

```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/uncensored_ai"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# OpenAI
OPENAI_API_KEY="sk-your-openai-api-key"

# Stripe (use test keys)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# Admin
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123"
```

### 5. Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed database with test data
npx prisma db seed
```

### 6. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Linting

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

### Type Checking

```bash
# Run TypeScript compiler
npx tsc --noEmit
```

### Database Management

```bash
# Open Prisma Studio (database GUI)
npx prisma studio

# Create a new migration
npx prisma migrate dev --name your_migration_name

# Reset database (warning: deletes all data)
npx prisma migrate reset
```

## Testing Stripe Webhooks Locally

### 1. Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Other platforms: https://stripe.com/docs/stripe-cli
```

### 2. Login to Stripe

```bash
stripe login
```

### 3. Forward Webhooks to Local Server

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This will output a webhook signing secret. Add it to your `.env.local`:

```env
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 4. Test Webhook Events

```bash
# Trigger a test subscription created event
stripe trigger customer.subscription.created
```

## Creating Test Data

### Create Test User

```javascript
// Create test user with bcryptjs
const bcrypt = require('bcryptjs');
const hashedPassword = bcrypt.hashSync('testpassword', 10);

// Use Prisma Studio or run in Node REPL:
const { prisma } = require('./lib/prisma');
await prisma.user.create({
  data: {
    email: 'test@example.com',
    passwordHash: hashedPassword,
    isAdmin: false,
  }
});
```

### Create Test Subscription

```javascript
await prisma.subscription.create({
  data: {
    userId: 'user_id_here',
    stripeSubscriptionId: 'sub_test_123',
    tier: 'premium',
    quota: 200000,
    used: 0,
    status: 'active',
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  }
});
```

## Testing API Endpoints

### Using cURL

```bash
# Test authentication
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword"}'

# Test assistant endpoint (requires session cookie)
curl -X POST http://localhost:3000/api/assistant \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"prompt":"Hello, how are you?","maxTokens":100}'
```

### Using Thunder Client / Postman

1. Import the API collection (if available)
2. Set up environment variables
3. Test each endpoint individually

## Common Issues

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Database Connection Errors

```bash
# Check if PostgreSQL is running
docker ps

# View logs
docker-compose logs postgres

# Restart services
docker-compose restart
```

### Prisma Client Issues

```bash
# Regenerate Prisma client
npx prisma generate

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### OpenAI API Errors

- Verify API key is correct
- Check account has credits
- Ensure API key has correct permissions

## Code Style Guide

### TypeScript

- Use explicit types for function parameters and return values
- Prefer interfaces over types for object definitions
- Use async/await over promises

### API Routes

- Always validate input
- Return appropriate HTTP status codes
- Log errors with context
- Handle edge cases

### Database Operations

- Use Prisma for all database operations
- Handle connection errors gracefully
- Use transactions for multi-step operations

## Project Structure

```
uncensored-ai/
├── docs/              # Documentation
├── lib/               # Utility modules
│   ├── billingQuota.ts
│   └── prisma.ts
├── pages/             # Next.js pages and API routes
│   ├── api/
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── stripe/
│   │   └── assistant.ts
│   └── admin/
├── prisma/            # Database schema and migrations
├── tests/             # Test files
├── types/             # TypeScript type declarations
└── ...config files
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [OpenAI API Documentation](https://platform.openai.com/docs)
