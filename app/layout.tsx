import type { Metadata } from "next";
import { Figtree, Lora } from "next/font/google";
import "./globals.css";
import MobileBottomBar from "@/components/MobileBottomBar";
import QuickViewPanel from "@/components/QuickViewPanel";
import ToastNotification from "@/components/admin/ToastNotification";

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
          {children}
          <QuickViewPanel />
          <MobileBottomBar />
          <ToastNotification />
        </AuthProvider>
      </body>
    </html>
  );
}
