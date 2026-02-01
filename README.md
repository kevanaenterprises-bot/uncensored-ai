# Next.js Full-Stack Application

This is a minimal full-stack Next.js application with TypeScript and Tailwind CSS.

## Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Secret for NextAuth
- `NEXTAUTH_URL`: URL for NextAuth
- `OPENAI_API_KEY`: OpenAI API key
- `STRIPE_SECRET_KEY`: Secret key for Stripe
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Publishable key for Stripe
- `REDIS_URL`: Redis connection string (optional)
- `ADMIN_EMAIL`: Admin email
- `ADMIN_PASSWORD`: Admin password

## Local Development
1. Run `docker-compose up` to start services.
2. Run `npx prisma migrate dev` to set up the database.
3. Run `npm install` to install dependencies.
4. Run `npm run dev` to start the application.

## Deployment Instructions
Deploy to Vercel. Set necessary environment variables in Vercel secrets.

## Security Notes
Do not store secrets in the repository.
Include instructions to create Stripe products and prices, replacing price IDs as needed.

## Placeholder In Structure
- Check files for TODO comments and placeholders for necessary deployment values.

