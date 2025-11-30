import { getHeroSlides } from "@/lib/shopify-admin";
import HeroAdminClient from "@/components/admin/HeroAdminClient";

export const dynamic = "force-dynamic";

export default async function HeroAdminPage() {
    let slides = [];
    try {
        slides = await getHeroSlides();
    } catch (error) {
        console.error("Failed to fetch hero slides:", error);
    }

    return <HeroAdminClient initialSlides={slides} />;
}
