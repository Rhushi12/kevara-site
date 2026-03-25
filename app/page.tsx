import { Suspense } from 'react';
import PageRenderer from "@/components/PageRenderer";
import { getPageContent } from "@/lib/shopify-admin";
import { resolveImageGidsInSections } from "@/lib/content-utils";

import { headers } from "next/headers";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Lightweight skeleton shown while the CMS data streams in
function PageSkeleton() {
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Navbar skeleton */}
      <div className="h-16 bg-white/80 backdrop-blur border-b border-gray-100" />
      {/* Hero skeleton */}
      <div className="w-full h-[70vh] bg-gradient-to-b from-gray-100 to-gray-50 animate-pulse" />
      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Async data-fetching component (runs server-side, streams when ready)
async function HomeContent() {
  let initialContent = null;
  try {
    const data = await getPageContent("homepage");
    initialContent = await resolveImageGidsInSections(data);
  } catch (error) {
    console.error("Failed to fetch homepage content:", error);
  }
  return <PageRenderer slug="homepage" initialContent={initialContent} />;
}

export default async function Home() {
  await headers(); // Force dynamic rendering

  return (
    <Suspense fallback={<PageSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}
