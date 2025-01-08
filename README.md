# Titan

Easy-to-setup, fully-featured, and customizable NextJS Boilerplate.

## Tech Stack

- [NextJS 15](https://nextjs.org/) - Full-Stack React framework
- [Supabase](https://supabase.com/) - Database
- [Clerk](https://clerk.com/) - Authenticate your Users
- [Stripe](https://stripe.com/) - Collect Payments
- [Plunk](https://useplunk.com/) - Send Emails
- [Umami](https://umami.is/) - Analyze User Behavior
- [Vercel](https://vercel.com/) - Deployments

## Prerequisites

1. Install [nvm](https://github.com/nvm-sh/nvm)
2. Install Node.js LTS version 22 using nvm:
   ```bash
   nvm install 22 --lts
   ```

## Quick Setup

First, gather your API keys from the following services:

   - **Supabase** (Database)
     - Create account at [Supabase](https://supabase.com)
     - Create a new project
     - Note: When creating your database password, avoid special characters like '#' and '&' as they cause URL encoding issues
     - Copy your `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` from the 'Connect' Settings on the main Project Dashboard page and under 'App Frameworks'

   - **Clerk** (Authentication)
     - Create account at [Clerk](https://clerk.com)
     - Create a new Application
     - Copy your `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` from the 'API Keys' section

   - **Stripe** (Payments)
     - Create account at [Stripe](https://stripe.com)
     - Copy your `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` from the 'API Keys' section
     - Create a product and get your `NEXT_PUBLIC_STRIPE_PRICE_ID`

   - **Plunk** (Email)
     - Create account at [Plunk](https://useplunk.com)
     - Copy your `PLUNK_API_KEY` from Project Settings > API Keys

1. Once you have your keys ready, create your project locally by running:
   ```bash
   npx @codeandcreed/create-titan@latest my-app
   ```

2. Follow the CLI prompts to configure your project with the API keys you've gathered.

Done. Your project is now ready to start developing locally.

## Local Development

### Saving Users to your Database
1. Create a webhook in your Clerk Application (Development)
2. Set the webhook URL to `http://localhost:3000/api/webhooks/clerk`

### Testing Payments with the Stripe CLI

1. Install the Stripe CLI
2. Run `stripe login`
3. Run `stripe listen --forward-to http://localhost:3000/api/webhooks/stripe`
4. Done. Your site should now be able to receive webhooks from Stripe and you can test payments locally.

## Updating your Database Schema

1. Modify your database schema in `prisma/schema.prisma`
2. Generate a new migration:
   ```bash
   pnpm prisma migrate dev --name <migration-name>
   ```
3. Deploy the migration to your database:
   ```bash
   pnpm prisma migrate deploy
   ```

## Deploying to Production

1. Create a new repository on Github
2. Push all your changes to the new repository
3. Deploy your site to Vercel with the equivalent 'Production' Environment Variables of all the above services

## Analytics

Track your site visitors and get insights on how they interact with your site.

1. Create an account at [Umami](https://umami.is/)
2. Copy the Tracking code and paste it into the head of your `index.html` file
3. Deploy your site
4. Done. Real-time traffic data should now be being tracked.

## Learn More

Refer to the documentation of the individual technologies:
- [NextJS Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.io/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Clerk Documentation](https://clerk.dev/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Plunk Documentation](https://docs.useplunk.com/)

## Contributing

Any beneficial contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

