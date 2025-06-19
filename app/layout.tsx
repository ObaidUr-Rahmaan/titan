import Provider from '@/app/provider';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import AuthWrapper from '@/components/wrapper/auth-wrapper';
import { ErrorBoundary } from '@/components/wrapper/error-boundary';
import { WebVitals } from '@/components/web-vitals';
import { ReactScan } from '@/components/react-scan';
import { Analytics } from '@vercel/analytics/react';
import type { Metadata } from 'next';
import './globals.css';
import { validateConfig } from '@/lib/config-validator';
import '@fontsource/sora/400.css';
import '@fontsource/sora/500.css';
import '@fontsource/sora/600.css';
import '@fontsource/sora/700.css';

// Validate config on app initialization
validateConfig();

export const metadata: Metadata = {
  metadataBase: new URL('https://titan.codeandcreed.tech'),
  title: {
    default: 'Titan - Boilerplate',
    template: `%s | Boilerplate`,
  },
  description:
    'Kickstart your next project with minimal friction - so you can focus on building cool stuff',
  icons: [
    { rel: 'icon', url: '/favicon.ico' },
    { rel: 'icon', url: '/favicon.png', type: 'image/png' },
    { rel: 'apple-touch-icon', url: '/favicon.png' },
  ],
  openGraph: {
    description:
      'Kickstart your next project with minimal friction - so you can focus on building cool stuff',
    images: ['https://utfs.io/f/8a428f85-ae83-4ca7-9237-6f8b65411293-eun6ii.png'],
    url: 'titan.codeandcreed.tech',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Titan Boilerplate',
    description:
      'Kickstart your next project with minimal friction - so you can focus on building cool stuff',
    siteId: '',
    creator: '@_7obaid_',
    creatorId: '',
    images: ['https://utfs.io/f/8a428f85-ae83-4ca7-9237-6f8b65411293-eun6ii.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthWrapper>
      <html lang="en" suppressHydrationWarning>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <link rel="icon" type="image/png" href="/favicon.png" />
          <link
            rel="preload"
            href="https://utfs.io/f/31dba2ff-6c3b-4927-99cd-b928eaa54d5f-5w20ij.png"
            as="image"
          />
          <link
            rel="preload"
            href="https://utfs.io/f/69a12ab1-4d57-4913-90f9-38c6aca6c373-1txg2.png"
            as="image"
          />
        </head>

        {/* REPLACE ME ---- Insert </script> tag for DataFast to analyse User traffic */}

        <body className="font-sora">
          <ErrorBoundary>
            <Provider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                {children}
                <Toaster />
              </ThemeProvider>
            </Provider>
          </ErrorBoundary>
          <WebVitals />
          <ReactScan />
          <Analytics />
        </body>
      </html>
    </AuthWrapper>
  );
}
