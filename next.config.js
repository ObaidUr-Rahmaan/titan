/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exclude Supabase edge functions from TypeScript checking and build
  typescript: {
    ignoreBuildErrors: false,
    // Exclude Supabase edge functions directory from type checking
  },
  
  // Webpack configuration to exclude Supabase edge functions
  webpack: (config, { dev, isServer }) => {
    // Exclude Supabase edge functions from compilation
    config.module.rules.push({
      test: /supabase\/functions\/.*\.ts$/,
      use: 'ignore-loader',
    });
    
    return config;
  },
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  experimental: {
    // PPR is canary-only, removed for stable Next.js
    // ppr: 'incremental',
    
    // React Compiler is experimental but available in stable
    reactCompiler: false, // Disabled for stability
    
    // Optimize CSS imports - disabled due to critters dependency issue
    // optimizeCss: true,
    
    // Faster development builds
    webpackBuildWorker: true,
    
    // Turbopack configuration for development
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  allowedDevOrigins: [
    // Add your specific ngrok URL here when using it
    '8115746baf52.ngrok.app',
    // You'll need to update this with your actual ngrok URL when it changes
  ],
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'https://213fc9e9c214.ngrok.appelf'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'seo-heist.s3.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'github.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ansubkhan.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'tanstack.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; worker-src 'self' blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdn.clerk.io https://clerk.rival-sonar.com https://*.clerk.accounts.dev https://va.vercel-scripts.com https://challenges.cloudflare.com blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: https://img.clerk.com; font-src 'self' data:; connect-src 'self' https://api.stripe.com https://clerk.io https://clerk.rival-sonar.com https://*.clerk.accounts.dev https://*.supabase.co https://*.upstash.io; frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://clerk.rival-sonar.com https://*.clerk.accounts.dev https://challenges.cloudflare.com; object-src 'none'; base-uri 'self';"
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  },
};
module.exports = nextConfig;
