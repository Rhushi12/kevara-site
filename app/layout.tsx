import type { Metadata, Viewport } from "next";
import { Figtree, Lora, Prata } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
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

import { db } from "@/lib/firebase-admin";

export async function generateMetadata(): Promise<Metadata> {
  const defaultTitle = "Kevara | Timeless Elegance";
  const defaultDesc = "Discover Kevara's high-end fashion collection. Timeless elegance designed for the modern era.";
  const defaultImage = "/og-image.jpg";

  let title = defaultTitle;
  let description = defaultDesc;
  let ogImage = defaultImage;

  let keywords = ["fashion", "luxury", "clothing", "kevara", "elegance", "women's fashion", "men's fashion"];

  try {
    const docRef = db.collection("config").doc("seo");
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      const data = docSnap.data();
      if (data?.title) title = data.title;
      if (data?.description) description = data.description;
      if (data?.ogImage) ogImage = data.ogImage;
      if (data?.keywords) {
        // Support both string "a, b, c" and array formats if user entered manually, but UI sends string.
        keywords = data.keywords.split(',').map((k: string) => k.trim());
      }
    }
  } catch (error) {
    console.warn("Failed to fetch SEO config:", error);
  }

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://kevara.in"),
    title: {
      default: title,
      template: "%s | Kevara"
    },
    description: description,
    keywords: keywords,
    authors: [{ name: "Kevara" }],
    openGraph: {
      type: "website",
      locale: "en_US",
      url: "/",
      title: title,
      description: description,
      siteName: "Kevara",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "Kevara Fashion",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: [ogImage],
      creator: "@kevara",
    },
    icons: {
      icon: "/logo.png",
      shortcut: "/logo.png",
      apple: "/logo.png",
    },
  };
}

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
import GlobalWholesaleInquiryModal from "@/components/GlobalWholesaleInquiryModal";
import WholesaleFloatingButton from "@/components/WholesaleFloatingButton";
import PageViewsTracker from "@/components/PageViewsTracker";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch SEO config for JSON-LD
  let seoConfig: any = {};
  try {
    const docRef = db.collection("config").doc("seo");
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      seoConfig = docSnap.data();
    }
  } catch (error) {
    console.warn("Failed to fetch SEO config for schema:", error);
  }

  // Generate JSON-LD
  const jsonLd = seoConfig.enableSchema !== false ? {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Kevara",
    "url": process.env.NEXT_PUBLIC_SITE_URL || "https://kevara.in",
    "logo": seoConfig.ogImage || "https://kevara.in/logo.png",
    "description": seoConfig.description || "Timeless Elegance",
    "sameAs": [
      seoConfig.social?.instagram,
      seoConfig.social?.facebook,
      seoConfig.social?.twitter
    ].filter(Boolean)
  } : null;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${figtree.variable} ${lora.variable} ${prata.variable} font-figtree antialiased bg-[#FDFBF7] text-slate-900`}
      >
        {/* JSON-LD Schema */}
        {jsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        )}

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
              <WholesaleFloatingButton />
              <ToastContainer />
              <GlobalWholesaleInquiryModal />
            </OfferProvider>
          </ToastProvider>
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
        <PageViewsTracker />
      </body>
    </html>
  );
}
