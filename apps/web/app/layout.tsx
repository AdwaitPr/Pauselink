import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'PauseLink Console | Real-time Suspicious Link & Threat Analysis',
  description: 'Cross-platform deterministic security scanner with real-time mobile sync via Supabase CDC.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-slate-100 min-h-screen flex flex-col antialiased">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-surface-elevated py-6 text-center text-xs text-slate-500">
          PauseLink Security &copy; {new Date().getFullYear()} &bull; 100% Deterministic &bull; Zero Network Fetching
        </footer>
      </body>
    </html>
  );
}
