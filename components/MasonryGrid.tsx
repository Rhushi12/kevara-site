"use client";

import ProductCard from "./ProductCard";

interface Product {
    node: {
        id: string;
        title: string;
        handle: string;
        priceRange: {
            minVariantPrice: {
                amount: string;
                currencyCode: string;
            };
        };
        images: {
            edges: {
                node: {
                    url: string;
                    altText: string;
                };
            }[];
        };
        variants: {
            edges: {
                node: {
                    id: string;
                    title: string;
                };
            }[];
        };
    };
}

interface MasonryGridProps {
    products: Product[];
}

export default function MasonryGrid({ products }: MasonryGridProps) {
    return (
        <section className="container mx-auto px-4 py-16">
            <h2 className="text-3xl font-lora text-center mb-12 text-slate-900">
                Curated For You
            </h2>

            {/* The "Focal" Logic: Hybrid Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 auto-rows-[minmax(300px,auto)]">
                {products.map((product, index) => (
                    <div
                        key={product.node.id}
                        // The "Focal" Logic: Make the first item BIG
                        // Item 1 (index 0) spans 2 rows and 2 columns
                        className={index === 0 ? "col-span-2 row-span-2" : "col-span-1 row-span-1"}
                    >
                        <ProductCard product={product} />
                    </div>
                ))}
            </div>
        </section>
    );
}
