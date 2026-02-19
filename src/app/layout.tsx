
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase';
import { Inter } from 'next/font/google';
import { ToastContainer } from '@/components/ToastContainer';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'AmbientaR',
  description: 'Streamlined ERP for small environmental businesses in Minas Gerais.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AmbientaR",
  },
};

export const viewport: Viewport = {
  themeColor: "#4CAF50",
};

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
         <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-body antialiased',
          inter.variable
        )}
      >
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <FirebaseClientProvider>
                {children}
            </FirebaseClientProvider>
            <ToastContainer />
        </ThemeProvider>
      </body>
    </html>
  );
}
