import PageRenderer from "@/components/PageRenderer";
import { getPageContent } from "@/lib/shopify-admin";
import { resolveImageGidsInSections } from "@/lib/content-utils";

export const dynamic = 'force-dynamic';

export default async function Home() {
  let initialContent = null;
  try {
    const data = await getPageContent("homepage");
    initialContent = await resolveImageGidsInSections(data);
  } catch (error) {
    console.error("Failed to fetch homepage content:", error);
  }

  return <PageRenderer slug="homepage" initialContent={initialContent} />;
}
