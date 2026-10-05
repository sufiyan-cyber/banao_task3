import type { Metadata } from 'next';
import { Playfair_Display, Source_Sans_3, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { HardwareNoticeBanner } from '@/components/HardwareNoticeBanner';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ShadePilot — Atelier Ceramic Tile Shade Correction',
  description:
    'Closed-loop ceramic tile shade-correction system integrating color science, printer calibration models, structured Jev decisions, and QC verification.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${sourceSans.variable} ${ibmPlexMono.variable}`}
    >
      <body className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A] font-sans antialiased selection:bg-[#B8860B] selection:text-white flex flex-col">
        <HardwareNoticeBanner />
        <Header />
        <div className="flex flex-1 min-h-0">
          <Sidebar />
          <main className="flex-1 p-6 md:p-10 overflow-y-auto bg-[#FAFAF8]">
            <div className="max-w-6xl mx-auto">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
