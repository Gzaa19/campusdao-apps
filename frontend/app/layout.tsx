import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "CampusDAO — Decentralized Community Service Funding",
    template: "%s | CampusDAO",
  },
  description:
    "A transparent, student-governed funding platform built on the Stellar blockchain. Submit proposals, vote democratically, and receive trustless funding for your campus community projects.",
  keywords: ["DAO", "Stellar", "Soroban", "Web3", "Student", "Funding", "Blockchain"],
  openGraph: {
    type: "website",
    title: "CampusDAO",
    description: "Decentralised community service funding on Stellar",
    siteName: "CampusDAO",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}
    >
      <body>
        <ThemeProvider>
          <TooltipProvider delayDuration={200}>
            {children}
            <Toaster richColors position="bottom-right" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
