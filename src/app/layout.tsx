import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "@/components/ui/sonner";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import { ThemeProvider } from "@/components/providers/theme-provider";
import { NavigationProvider } from "@/components/NavigationProvider";
import NavigationLoader from "@/components/NavigationLoader";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import { OfflineDetector } from "@/components/OfflineDetector";
import { SkipLink } from "@/components/ui/skip-link";
import { Suspense } from "react";
import "./globals.css";

const geistSans = GeistSans;
const geistMono = GeistMono;

export const metadata: Metadata = {
  title: {
    template: "%s — Knasty Portal",
    default: "Knasty Portal",
  },
  description: "Sunday School Management System",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    noimageindex: true,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noarchive: true,
      noimageindex: true,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get the locale from next-intl
  const locale = await getLocale();

  // Get messages for the locale
  const messages = await getMessages();

  // Determine text direction (RTL for Arabic)
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={null}>
            <NavigationProvider>
              <NavigationLoader />
              <NextIntlClientProvider messages={messages}>
                <SkipLink />
                <PermissionsProvider>
                  {children}
                  <Toaster />
                  <OfflineDetector />
                </PermissionsProvider>
              </NextIntlClientProvider>
            </NavigationProvider>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
