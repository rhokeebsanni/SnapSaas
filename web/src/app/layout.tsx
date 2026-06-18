import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { Toaster } from 'sonner';
import './globals.css';

import { ThemeProvider } from '@/components/theme-provider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'SnapSaas — Turn any URL into launch-ready screenshots',
    template: '%s · SnapSaas',
  },
  description:
    'Paste a URL, pick a style, and SnapSaas captures your site and drops it into a polished device frame with a beautiful background — share-ready in seconds.',
  keywords: [
    'screenshot generator',
    'website mockup',
    'device frames',
    'marketing screenshots',
    'product launch assets',
  ],
  applicationName: 'SnapSaas',
  openGraph: {
    type: 'website',
    siteName: 'SnapSaas',
    title: 'SnapSaas — Turn any URL into launch-ready screenshots',
    description: 'One-click, gorgeous marketing screenshots for founders, devs, and indie hackers.',
    url: appUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SnapSaas — Turn any URL into launch-ready screenshots',
    description: 'One-click, gorgeous marketing screenshots for founders, devs, and indie hackers.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
          <Toaster richColors closeButton position="top-center" />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
