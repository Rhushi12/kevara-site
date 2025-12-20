import { notFound } from "next/navigation";
import ProductGallery from "@/components/pdp/ProductGallery";
import EditableProductInfo from "@/components/pdp/EditableProductInfo";
import ProductTabs from "@/components/pdp/ProductTabs";
import CompleteLook from "@/components/pdp/CompleteLook";
import ProductStory from "@/components/pdp/ProductStory";
import QuoteSection from "@/components/pdp/QuoteSection";
import StickyProductBar from "@/components/pdp/StickyProductBar";
import SizeGuidePanel from "@/components/SizeGuidePanel";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getCustomProductBySlug, getCustomProducts } from "@/lib/custom-products";
import { getPageContent } from "@/lib/shopify-admin";
import RelatedProductsCarousel from "@/components/pdp/RelatedProductsCarousel";
import SustainabilityBanner from "@/components/pdp/SustainabilityBanner";
import { MOCK_SHOPIFY_PRODUCTS } from "@/lib/mockData";

// Force dynamic rendering to always fetch fresh product data
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProductPage({ params }: { params: { slug: string } }) {
    // Await params for Next.js 15 compatibility
    // @ts-ignore
    const { slug } = await params || params;

    // Fetch custom product data by slug
    console.log('[PDP] Looking for product with slug:', slug);
    let product = null;
    try {
        product = await getCustomProductBySlug(slug);
        console.log('[PDP] Product found in Shopify:', product ? product.title : 'NULL');
    } catch (error) {
        console.error("Error fetching product:", error);
    }

    // Fallback to mock data if not found in Shopify (to support homepage mock products)
    if (!product) {
        const mockProduct = MOCK_SHOPIFY_PRODUCTS.find(p => p.node.handle === slug || p.node.slug === slug);
        if (mockProduct) {
            console.log('[PDP] Product found in Mock Data:', mockProduct.node.title);
            product = mockProduct.node;
        }
    }

    if (!product) {
        console.error('[PDP] Product not found for slug:', slug);
        return notFound();
    }

    const { title, priceRange, images, variants, descriptionHtml, colors: productColors, sizes: productSizes, video } = product;
    console.log(`[PDP Debug] Product: ${title}, Video: ${video ? 'Present' : 'Missing'}, Video URL: ${video}`);
    const price = parseFloat(priceRange.minVariantPrice.amount);
    const currency = priceRange.minVariantPrice.currencyCode;

    // Transform images
    const productImages = images.edges.map((edge: any) => edge.node.url);

    // Use colors and sizes from custom product data
    console.log(`[PDP Debug] Raw productColors:`, productColors);
    console.log(`[PDP Debug] Raw productSizes:`, productSizes);

    let colors = productColors && productColors.length > 0 ? productColors : [];
    let sizes = productSizes && productSizes.length > 0 ? productSizes : [];

    // Only fall back to variant extraction if BOTH colors and sizes are empty
    // (for backwards compatibility with old Shopify products)
    if (colors.length === 0 && sizes.length === 0) {
        const uniqueColors = new Set<string>();
        const uniqueSizes = new Set<string>();

        variants.edges.forEach((v: any) => {
            const parts = v.node.title.split("/");
            if (parts.length > 1) {
                uniqueSizes.add(parts[0].trim());
                uniqueColors.add(parts[1].trim());
            }
        });

        if (uniqueColors.size > 0) {
            colors = Array.from(uniqueColors).map(name => ({
                name,
                hex: getColorHex(name)
            }));
        }

        if (uniqueSizes.size > 0) {
            sizes = Array.from(uniqueSizes);
        }
    }

    // Default fallbacks if still empty
    // No fallback - if no sizes defined, sizes remains empty

    // Fetch related custom products
    const allProducts = await getCustomProducts();
    const relatedProducts = allProducts
        .filter((edge: any) => edge.node.handle !== product.handle) // Exclude current product
        .map((edge: any) => edge.node);

    // Fetch global PDP settings
    const globalSettings = await getPageContent("pdp-global-settings");

    return (
        <main className="bg-white min-h-screen">
            <Navbar />
            <StickyProductBar
                product={{
                    title: title,
                    price: price,
                    image: productImages[0],
                    colors: colors,
                    sizes: sizes
                }}
            />
            <SizeGuidePanel />

            {/* Breadcrumbs */}
            <div className="container mx-auto px-4 py-6">
                <nav className="text-xs text-slate-500 flex gap-2">
                    <span>Home</span> / <span>Shop</span> / <span className="text-slate-900">{title}</span>
                </nav>
            </div>

            {/* Main Product Section */}
            <div className="container mx-auto px-4 mb-24">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                    {/* Left: Gallery (7 cols) */}
                    <div className="md:col-span-7">
                        <ProductGallery images={images} video={video} />
                    </div>

                    {/* Right: Info (5 cols) */}
                    <div className="md:col-span-5">
                        <EditableProductInfo
                            title={title}
                            price={price}
                            // originalPrice={price * 1.2} // Removed fake original price
                            colors={colors}
                            sizes={sizes}
                            description={descriptionHtml}
                            handle={product.handle}
                        />
                    </div>
                </div>
            </div>

            {/* Split Section: Tabs + Complete Look */}
            <div className="container mx-auto px-4 mb-24">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pt-12">
                    {/* Left: Tabs (7 cols) */}
                    <div className="md:col-span-7">
                        <ProductTabs description={descriptionHtml} />
                    </div>

                    {/* Right: Complete Look (5 cols) */}
                    <div className="md:col-span-5 pl-0 md:pl-8">
                        <CompleteLook
                            currentProductHandle={product.handle}
                            initialRelatedIds={product.relatedProducts || []}
                            availableProducts={allProducts.map((edge: any) => edge.node)}
                        />
                    </div>
                </div>
            </div>

            {/* Brand Story */}
            <ProductStory initialData={globalSettings?.product_story} />



            {/* Quote Section */}
            <QuoteSection />

            {/* Sustainability Banner */}
            <SustainabilityBanner initialData={globalSettings?.sustainability_banner} />

            {/* You May Also Like */}
            <RelatedProductsCarousel products={relatedProducts} />

            <Footer />
        </main>
    );
}

// Helper to map color names to hex
function getColorHex(name: string) {
    const map: Record<string, string> = {
        "Blue": "#1E3A8A",
        "Red": "#B91C1C",
        "Beige": "#D4D4D8",
        "Black": "#18181B",
        "Grey": "#71717A",
        "Brown": "#78350F",
        "Olive": "#555B46",
        "Sand": "#D8C8B8",
        "Purple": "#6B21A8",
        "White": "#FFFFFF",
        "Default": "#000000",
        "Green": "#15803d",
    };
    return map[name] || "#000000";
}
