"use client";

import { RefreshCw, ShieldCheck, Star, Truck } from "lucide-react";

export default function Features() {
    const features = [
        {
            icon: Truck,
            title: "Fast Delivery",
            description: "Within 3-5 business days",
        },
        {
            icon: ShieldCheck,
            title: "Premium Quality",
            description: "Certified authentic materials",
        },
        {
            icon: Star,
            title: "5-Star Rated",
            description: "Loved by 10,000+ customers",
        },
        {
            icon: RefreshCw,
            title: "Easy Returns",
            description: "Hassle-free 30-day policy",
        },
    ];

    return (
        <section className="bg-white py-16 border-t border-gray-100">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={index}
                                className="flex flex-col items-center text-center gap-4 p-6 rounded-lg hover:bg-warm-cream/50 transition-colors duration-300"
                            >
                                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-deep-teal/10 text-deep-teal">
                                    <Icon size={24} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-lora font-bold text-deep-teal mb-1">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm font-figtree text-slate-600">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
