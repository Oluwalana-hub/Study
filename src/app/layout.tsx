import Navbar from '@/components/Navbar';
import PWARegister from '@/components/PWARegister';
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StudyForge - Document-Grounded Bloom Taxonomy Learning Platform',
  description:
    'Transform your study materials into an active, structured learning experience based on Bloom’s Taxonomy. Powered by document-grounded AI.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'StudyForge PWA',
  },
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0c8de9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="StudyForge" />
        <meta name="apple-mobile-web-app-title" content="StudyForge" />
      </head>
      <body className="h-full flex flex-col antialiased selection:bg-primary-500 selection:text-white">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <PWARegister />
        <footer className="w-full border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <div>&copy; {new Date().getFullYear()} StudyForge PWA. Built with Bloom&apos;s Taxonomy &amp; GitHub Actions.</div>
            <div className="flex space-x-4">
              <span>PWA Ready &amp; Installable</span>
              <span>•</span>
              <span>GitHub CI Integration</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
