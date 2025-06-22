const config = {
  auth: {
    enabled: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? true : false,
    trialCheckEnabled: false, // Disabled due to Supabase API key issues
    redirectAfterSignIn: '/dashboard',
    redirectAfterSignUp: '/onboarding',
  },
  payments: {
    enabled: true,
  },
  email: {
    enabled: true,
  },
};

export default config;
