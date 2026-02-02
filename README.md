# Next.js Full-Stack Application

[![CI](https://github.com/kevanaenterprises-bot/uncensored-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/kevanaenterprises-bot/uncensored-ai/actions/workflows/ci.yml)
[![Release](https://github.com/kevanaenterprises-bot/uncensored-ai/actions/workflows/release.yml/badge.svg)](https://github.com/kevanaenterprises-bot/uncensored-ai/actions/workflows/release.yml)
[![Docker](https://github.com/kevanaenterprises-bot/uncensored-ai/actions/workflows/publish-ghcr.yml/badge.svg)](https://github.com/kevanaenterprises-bot/uncensored-ai/actions/workflows/publish-ghcr.yml)

This is a full-stack Next.js application with TypeScript, Tailwind CSS, authentication, subscription billing, and AI integration.

## Features

- 🔐 **Authentication**: Secure email/password authentication with NextAuth.js
- 💳 **Subscription Billing**: Stripe integration with multiple tiers
- 🤖 **AI Integration**: OpenAI API integration with quota management
- 📊 **Usage Tracking**: Track token usage and enforce billing quotas
- 👥 **Admin Panel**: Admin tools for quota overrides and user management
- 🗄️ **Database**: PostgreSQL with Prisma ORM
- 🔒 **Security**: Bcrypt password hashing, webhook verification, JWT sessions

## Documentation

- [Installation Guide](docs/INSTALLATION.md) - **Step-by-step dependency installation**
- [Development Guide](docs/DEVELOPMENT.md) - Local development setup
- [API Documentation](docs/API.md) - Detailed API endpoint reference
- [Deployment Guide](docs/DEPLOYMENT.md) - **Production deployment with Docker, GHCR, and Railway**

## Quick Start

> 📖 **New to this project?** See the [Installation Guide](docs/INSTALLATION.md) for detailed, step-by-step instructions for installing all dependencies.

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Stripe account (for billing)
- OpenAI API key

### Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd uncensored-ai
   npm install
   ```
   
   💡 **Having trouble?** Check the [Installation Guide](docs/INSTALLATION.md) for platform-specific instructions and troubleshooting.

2. **Start local services:**
   ```bash
   docker-compose up -d
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Initialize database:**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to see the application.

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Secret for NextAuth (generate with: `openssl rand -base64 32`)
- `NEXTAUTH_URL`: Application URL
- `OPENAI_API_KEY`: OpenAI API key
- `STRIPE_SECRET_KEY`: Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key
- `REDIS_URL`: Redis connection string (optional)
- `ADMIN_EMAIL`: Admin email
- `ADMIN_PASSWORD`: Admin password

## Technology Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Payment**: Stripe
- **AI**: OpenAI API
- **Testing**: Jest
- **Linting**: ESLint

## Project Structure

```
uncensored-ai/
├── docs/              # Documentation
├── lib/               # Utility modules (quota, database)
├── pages/             # Next.js pages and API routes
│   ├── api/           # API endpoints
│   │   ├── admin/     # Admin endpoints
│   │   ├── auth/      # Authentication
│   │   ├── stripe/    # Stripe webhooks
│   │   └── assistant.ts # AI assistant
│   └── admin/         # Admin pages
├── prisma/            # Database schema
├── tests/             # Test files
└── types/             # TypeScript declarations
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run docker:build` - Build Docker image locally

## Deployment

### Docker Deployment

The application includes a production-ready multi-stage Dockerfile:

```bash
# Build Docker image
npm run docker:build

# Or pull from GitHub Container Registry
docker pull ghcr.io/kevanaenterprises-bot/uncensored-ai:latest

# Run container
docker run -d -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e NEXTAUTH_SECRET="..." \
  ghcr.io/kevanaenterprises-bot/uncensored-ai:latest
```

### Railway Deployment

Deploy to Railway or any Node.js hosting platform. See [Deployment Guide](docs/DEPLOYMENT.md) for detailed instructions.

### Quick Deploy to Railway

```bash
npm install -g @railway/cli
railway login
railway link
railway up
```

## Security

- Passwords are hashed with bcrypt
- API keys and secrets stored in environment variables
- Stripe webhooks verified with signing secrets
- NextAuth JWT sessions with secure secrets
- Admin-only endpoints protected with role checks

## License

Private - All rights reserved

## Support

For issues and questions, please open an issue in the repository.
