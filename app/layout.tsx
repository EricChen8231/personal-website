import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Eric Chen | Portfolio",
  description:
    "Eric Chen — Computer Engineer & Software Developer. USC dual-degree student bridging full-stack development and digital VLSI design.",
  keywords: [
    "Eric Chen",
    "portfolio",
    "software engineer",
    "computer engineer",
    "USC",
    "full-stack developer",
    "VLSI",
  ],
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
