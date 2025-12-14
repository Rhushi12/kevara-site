import type { Metadata, Viewport } from "next";
import { Figtree, Lora } from "next/font/google";
import "./globals.css";
import QuickViewPanel from "@/components/QuickViewPanel";
import SearchPanel from "@/components/SearchPanel";
import ToastNotification from "@/components/admin/ToastNotification";
import FirstVisitHandler from "@/components/FirstVisitHandler";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://kevara-site.vercel.app"),
  title: {
    default: "Kevara | Timeless Elegance",
    template: "%s | Kevara"
  },
  description: "Discover Kevara's high-end fashion collection. Timeless elegance designed for the modern era.",
  keywords: ["fashion", "luxury", "clothing", "kevara", "elegance", "women's fashion", "men's fashion"],
  authors: [{ name: "Kevara" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Kevara | Timeless Elegance",
    description: "Discover Kevara's high-end fashion collection. Timeless elegance designed for the modern era.",
    siteName: "Kevara",
    images: [
      {
        url: "/og-image.jpg", // We'll need to make sure this exists or user adds it
        width: 1200,
        height: 630,
        alt: "Kevara Fashion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kevara | Timeless Elegance",
    description: "High-end fashion for the modern era.",
    images: ["/og-image.jpg"],
    creator: "@kevara",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${figtree.variable} ${lora.variable} font-figtree antialiased bg-[#FDFBF7] text-slate-900`}
      >
        <AuthProvider>
          <FirstVisitHandler />
          <div className="relative w-full overflow-x-hidden min-h-screen flex flex-col">
            {children}
          </div>
          <QuickViewPanel />
          <SearchPanel />
          <ToastNotification />
        </AuthProvider>
      </body>
    </html>
  );
}
