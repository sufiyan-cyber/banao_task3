import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { HardwareNoticeBanner } from '@/components/HardwareNoticeBanner';

export const metadata: Metadata = {
  title: 'ShadePilot — Intelligent Ceramic Tile Shade Correction System',
  description:
    'Closed-loop ceramic tile shade-correction prototype integrating color science, printer calibration models, structured Jev decisions, and QC verification.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100 flex flex-col text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
        <HardwareNoticeBanner />
        <Header />
        <div className="flex flex-1 min-h-0">
          <Sidebar />
          <main className="flex-1 p-6 md:p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
