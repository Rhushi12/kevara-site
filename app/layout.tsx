import type { Metadata, Viewport } from "next";
import { Figtree, Lora, Prata } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import FirstVisitHandler from "@/components/FirstVisitHandler";
import NextTopLoader from "nextjs-toploader";
import ClientOverlays from "@/components/ClientOverlays";

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

import localFont from "next/font/local";

const kamundi = localFont({
  src: "../public/fonts/Kamundi.ttf",
  variable: "--font-kamundi",
  weight: "400"
});

import { db } from "@/lib/firebase-admin";

export async function generateMetadata(): Promise<Metadata> {
  const defaultTitle = "Kevara | Premium Oversized Streetwear & Custom Fashion India";
  const defaultDesc = "Experience true comfort with Kevara. Shop India's finest 280 GSM heavyweight oversized t-shirts, premium hoodies, and limited edition streetwear drops.";
  const defaultImage = "/og-image.jpg";

  let title = defaultTitle;
  let description = defaultDesc;
  let ogImage = defaultImage;

  let keywords = ["oversized t shirt mens", "premium streetwear india", "280 GSM oversized t shirt", "custom graphic hoodies India", "kevara", "heavyweight cotton streetwear"];

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

  // Generate JSON-LD (Advanced Entity SEO)
  const jsonLd = seoConfig.enableSchema !== false ? {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${process.env.NEXT_PUBLIC_SITE_URL || "https://kevara.in"}/#organization`,
    "name": "Kevara",
    "legalName": "Kevara Apparel Private Limited", 
    "url": process.env.NEXT_PUBLIC_SITE_URL || "https://kevara.in",
    "logo": seoConfig.ogImage || "https://kevara.in/logo.png",
    "description": seoConfig.description || "Premium Oversized Streetwear & Custom Fashion. India's fastest growing D2C fashion brand.",
    "iso6523Code": "0060:KevaraApparel", // D&B identifier
    "taxID": "PENDING_GSTIN", // Ensure this matches legal entity later
    "foundingDate": "2024",
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "kevaraecommerce@gmail.com",
      "contactType": "customer support",
      "availableLanguage": ["English", "Hindi"]
    },
    "hasMerchantReturnPolicy": {
      "@type": "MerchantReturnPolicy",
      "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
      "merchantReturnDays": "30",
      "returnMethod": "https://schema.org/ReturnByMail",
      "returnFees": "https://schema.org/FreeReturn"
    },
    "sameAs": [
      seoConfig.social?.instagram,
      seoConfig.social?.facebook,
      seoConfig.social?.twitter,
      "https://www.linkedin.com/company/kevara",
      "https://www.justdial.com/kevara"
    ].filter(Boolean)
  } : null;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${figtree.variable} ${lora.variable} ${prata.variable} ${kamundi.variable} font-figtree antialiased bg-[#FDFBF7] text-slate-900`}
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
              <ClientOverlays />
              <ToastContainer />
            </OfferProvider>
          </ToastProvider>
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
