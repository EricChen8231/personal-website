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

export const metadata: Metadata = {
  title: 'Eric Chen — The Stack',
  description: 'Full-stack engineer — literally. From 45nm CMOS cells to production APIs.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${bricolageGrotesque.variable}`}>
      <body>{children}</body>
    </html>
  );
}
