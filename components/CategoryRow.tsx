"use client";

import { MOCK_SHOPIFY_PRODUCTS } from "@/lib/mockData";
import Image from "next/image";
import Link from "next/link";

export default function CategoryRow() {
    const categories = [
        "Shirts",
        "Pants",
        "Night Suits",
        "Gym Wear",
        "New Arrivals",
    ];

    // Use the first product image as a placeholder for all categories
    const placeholderImage =
        MOCK_SHOPIFY_PRODUCTS[0]?.node.images.edges[0]?.node.url || "";

    return (
        <section className="container mx-auto px-4 py-12">
            <div className="flex flex-wrap justify-center gap-8 md:gap-12">
                {categories.map((category, index) => (
                    <Link
                        key={index}
                        href={`/collections/${category.toLowerCase().replace(" ", "-")}`}
                        className="group flex flex-col items-center gap-3"
                    >
                        <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-transparent group-hover:border-slate-900 transition-all duration-300 p-1">
                            <div className="relative w-full h-full rounded-full overflow-hidden">
                                <Image
                                    src={placeholderImage}
                                    alt={category}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    sizes="(max-width: 768px) 96px, 128px"
                                />
                            </div>
                        </div>
                        <span className="text-sm font-medium font-figtree text-slate-900 group-hover:text-slate-900 transition-colors">
                            {category}
                        </span>
                    </Link>
                ))}
            </div>
        </section>
    );
}
