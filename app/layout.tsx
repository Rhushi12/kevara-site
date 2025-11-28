import type { Metadata } from "next";
import { Figtree, Lora } from "next/font/google";
import "./globals.css";
import MobileBottomBar from "@/components/MobileBottomBar";
import QuickViewPanel from "@/components/QuickViewPanel";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kevara - Timeless Elegance",
  description: "High-end fashion for the modern era.",
};

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
        {children}
        <QuickViewPanel />
        <MobileBottomBar />
      </body>
    </html>
  );
}
