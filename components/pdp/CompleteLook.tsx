"use client";

import Image from "next/image";
import Link from "next/link";

const LOOK_ITEMS = [
    {
        id: "1",
        label: "Knit Beige Cardigan",
        price: 120,
        image: "https://images.unsplash.com/photo-1624421242603-6056e4939b85?q=80&w=800&auto=format&fit=crop",
        href: "/products/knit-beige-cardigan",
    },
    {
        id: "2",
        label: "Black Slim Fit Jeans",
        price: 89,
        image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800&auto=format&fit=crop",
        href: "/products/black-slim-jeans",
    },
];

export default function CompleteLook() {
    return (
        <div className="h-full">
            <div className="mb-6">
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#006D77] mb-2">
                    Complete the Look
                </h2>
                <h3 className="text-2xl font-lora text-slate-900">
                    Style it with
                </h3>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 gap-4">
                {LOOK_ITEMS.map((item) => (
                    <Link key={item.id} href={item.href} className="group block">
                        <div className="relative aspect-[3/4] overflow-hidden mb-3 bg-gray-100 rounded-sm">
                            <Image
                                src={item.image}
                                alt={item.label}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-slate-900 group-hover:text-[#006D77] transition-colors line-clamp-1">
                                {item.label}
                            </h4>
                            <span className="text-xs text-slate-500">${item.price.toFixed(2)}</span>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="mt-6">
                <Link
                    href="/collections/new-arrivals"
                    className="text-xs font-medium text-[#006D77] underline underline-offset-4 hover:text-slate-900 transition-colors"
                >
                    View all matching items
                </Link>
            </div>
        </div>
    );
}
