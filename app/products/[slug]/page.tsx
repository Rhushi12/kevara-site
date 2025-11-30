import { notFound } from "next/navigation";
import ProductGallery from "@/components/pdp/ProductGallery";
import ProductInfo from "@/components/pdp/ProductInfo";
import ProductTabs from "@/components/pdp/ProductTabs";
import CompleteLook from "@/components/pdp/CompleteLook";
import ProductStory from "@/components/pdp/ProductStory";
import QuoteSection from "@/components/pdp/QuoteSection";
import StickyProductBar from "@/components/pdp/StickyProductBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getProductByHandle, getProducts } from "@/lib/shopify-admin";

export default async function ProductPage({ params }: { params: { slug: string } }) {
    // Await params for Next.js 15 compatibility
    // @ts-ignore
    const { slug } = await params || params;

    // Fetch real product data
    let product = null;
    try {
        product = await getProductByHandle(slug);
    } catch (error) {
        console.error("Error fetching product:", error);
    }

    if (!product) return notFound();

    const { title, priceRange, images, variants, descriptionHtml } = product;
    const price = parseFloat(priceRange.minVariantPrice.amount);
    const currency = priceRange.minVariantPrice.currencyCode;

    // Transform images
    const productImages = images.edges.map((edge: any) => edge.node.url);

    // Extract colors and sizes from variants
    const uniqueColors = new Set<string>();
    const uniqueSizes = new Set<string>();

    variants.edges.forEach((v: any) => {
        const parts = v.node.title.split("/");
        if (parts.length > 1) {
            uniqueSizes.add(parts[0].trim());
            uniqueColors.add(parts[1].trim());
        } else {
            uniqueSizes.add("One Size");
            uniqueColors.add("Default");
        }
    });

    const colors = Array.from(uniqueColors).map(name => ({
        name,
        value: getColorHex(name)
    }));

    const sizes = Array.from(uniqueSizes).length > 0 ? Array.from(uniqueSizes) : ["One Size"];

    // Fetch related products (just get first 4 for now)
    const relatedProductsEdges = await getProducts(4);
    const relatedProducts = relatedProductsEdges.map((edge: any) => edge.node);

    return (
        <main className="bg-white min-h-screen">
            <Navbar />
            <StickyProductBar
                product={{
                    title: title,
                    price: price,
                    image: productImages[0]
                }}
            />

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
                        <ProductGallery images={productImages} />
                    </div>

                    {/* Right: Info (5 cols) */}
                    <div className="md:col-span-5">
                        <ProductInfo
                            title={title}
                            price={price}
                            originalPrice={price * 1.2} // Mock original price
                            rating={4.8} // Mock rating
                            reviews={124} // Mock reviews
                            colors={colors}
                            sizes={sizes}
                            description={descriptionHtml}
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
                        <CompleteLook />
                    </div>
                </div>
            </div>

            {/* Brand Story */}
            <ProductStory />

            {/* Quote Section */}
            <QuoteSection />

            {/* You May Also Like */}
            <div className="py-24 bg-white">
                <div className="container mx-auto px-4 text-center mb-12">
                    <h2 className="text-3xl font-lora text-slate-900">You may also like</h2>
                </div>
                <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
                    {relatedProducts.map((p: any, i: number) => (
                        <div key={i} className="group cursor-pointer">
                            <div className="relative aspect-[3/4] bg-gray-100 mb-4 overflow-hidden rounded-sm">
                                <img
                                    src={p.images.edges[0]?.node.url}
                                    alt={p.title}
                                    className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                                />
                            </div>
                            <h3 className="text-sm font-medium text-slate-900 group-hover:text-[#006D77]">{p.title}</h3>
                            <span className="text-xs text-slate-500">
                                {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(parseFloat(p.priceRange.minVariantPrice.amount))}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

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
