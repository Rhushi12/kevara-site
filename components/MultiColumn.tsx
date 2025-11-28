"use client";

import Image from "next/image";
import Link from "next/link";

export default function MultiColumn() {
    const occasions = [
        {
            title: "Workwear",
            image:
                "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop", // Business Suit
            link: "/collections/workwear",
        },
        {
            title: "Casual",
            image:
                "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop", // Linen Shirt
            link: "/collections/casual",
        },
        {
            title: "Evening",
            image:
                "https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1000&auto=format&fit=crop", // Party Dress
            link: "/collections/evening",
        },
    ];

    return (
        <section className="container mx-auto px-4 py-16">
            <h2 className="text-3xl font-lora text-center mb-12 text-slate-900">
                Shop by Occasion
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {occasions.map((occasion, index) => (
                    <Link
                        key={index}
                        href={occasion.link}
                        className="group block"
                    >
                        <div className="relative h-[500px] w-full overflow-hidden mb-6">
                            <Image
                                src={occasion.image}
                                alt={occasion.title}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                sizes="(max-width: 768px) 100vw, 33vw"
                            />
                        </div>
                        <div className="text-center">
                            <h3 className="text-2xl font-lora text-slate-900 font-medium tracking-wide group-hover:underline underline-offset-4 decoration-1">
                                {occasion.title}
                            </h3>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
