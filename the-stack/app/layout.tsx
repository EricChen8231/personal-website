import type { Metadata } from 'next';
import { Space_Grotesk, Bricolage_Grotesque } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-sans',
  display: 'swap',
});

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: 'variable',
  variable: '--font-display',
  display: 'swap',
});

// metadataBase is the *origin* only — Next prepends basePath ("/personal-website") on top.
// If we include the basePath in metadataBase, og:image URLs end up doubled.
const SITE_ORIGIN = 'https://ericchen8231.github.io';
const SITE_URL = `${SITE_ORIGIN}/personal-website`;

export const metadata: Metadata = {
  title: 'Eric Chen — L1 → L7',
  description: 'End-to-end engineer — literally. From 45nm CMOS cells to production APIs.',
  openGraph: {
    title: 'Eric Chen — L1 → L7',
    description: 'End-to-end engineer — literally. From 45nm CMOS cells to production APIs.',
    url: SITE_URL,
    siteName: 'Eric Chen',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Eric Chen — L1 → L7',
    description: 'End-to-end engineer — literally. From 45nm CMOS cells to production APIs.',
  },
  metadataBase: new URL(SITE_ORIGIN),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${bricolageGrotesque.variable}`}>
      <body>{children}</body>
    </html>
  );
}
