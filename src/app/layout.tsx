import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";
import { ErrorBoundary } from "@/components/error/error-boundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FTaaS - Fine-Tuning as a Service",
  description: "Customize AI models with your data without ML expertise",
  keywords: ["FTaaS", "AI", "Fine-tuning", "Machine Learning", "Next.js", "TypeScript"],
  authors: [{ name: "FTaaS Team" }],
  openGraph: {
    title: "FTaaS - Fine-Tuning as a Service",
    description: "Customize AI models with your data without ML expertise",
    url: "https://ftaas.com",
    siteName: "FTaaS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FTaaS - Fine-Tuning as a Service",
    description: "Customize AI models with your data without ML expertise",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
