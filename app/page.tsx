import CleanGrid from "@/components/CleanGrid";
import EditorialSection from "@/components/EditorialSection";
import FabricFeature from "@/components/FabricFeature";
import Features from "@/components/Features";
import Footer from "@/components/Footer";
import HeroSlider from "@/components/HeroSlider";
import ShopByOccasion from "@/components/ShopByOccasion";
import ShopCategory from "@/components/ShopCategory";
import SalesSplit from "@/components/SalesSplit";
import CollectionGrid from "@/components/CollectionGrid";
import Navbar from "@/components/Navbar";
import VideoPromo from "@/components/VideoPromo";
import Testimonials from "@/components/Testimonials";
import { MOCK_SHOPIFY_PRODUCTS } from "@/lib/mockData";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSlider />
      <ShopByOccasion />
      <ShopCategory />
      <SalesSplit />
      <CollectionGrid />
      <EditorialSection />
      <CleanGrid products={MOCK_SHOPIFY_PRODUCTS} />
      <VideoPromo />
      <FabricFeature />
      <Testimonials />
      <Features />
      <Footer />
    </main>
  );
}
