import type { Metadata, Viewport } from "next";
import { Figtree, Lora, Prata } from "next/font/google";
import "./globals.css";
import QuickViewPanel from "@/components/QuickViewPanel";
import SearchPanel from "@/components/SearchPanel";
import ToastNotification from "@/components/admin/ToastNotification";
import FirstVisitHandler from "@/components/FirstVisitHandler";
import NextTopLoader from "nextjs-toploader";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

const prata = Prata({
  weight: "400",
  variable: "--font-prata",
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
import { OfferProvider } from "@/context/OfferContext";
import { ToastProvider } from "@/context/ToastContext";
import OfferSidebar from "@/components/OfferSidebar";
import AdminOfferButton from "@/components/admin/AdminOfferButton";
import ToastContainer from "@/components/ToastContainer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${figtree.variable} ${lora.variable} ${prata.variable} font-figtree antialiased bg-[#FDFBF7] text-slate-900`}
      >
        <AuthProvider>
          <ToastProvider>
            <OfferProvider>
              <NextTopLoader
                color="#0E4D55"
                initialPosition={0.08}
                crawlSpeed={200}
                height={3}
                crawl={true}
                showSpinner={false}
                easing="ease"
                speed={200}
                shadow="0 0 10px #0E4D55,0 0 5px #0E4D55"
              />
              <FirstVisitHandler />
              <OfferSidebar />
              <div className="relative w-full overflow-x-hidden min-h-screen flex flex-col">
                {children}
              </div>
              <QuickViewPanel />
              <SearchPanel />
              <ToastNotification />
              <AdminOfferButton />
              <ToastContainer />
            </OfferProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
