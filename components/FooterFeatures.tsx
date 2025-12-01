"use client";

import { useState, useRef, useEffect } from "react";
import { Truck, Headphones, Lock, Send } from "lucide-react";

const features = [
    {
        icon: Truck,
        title: "Free Shipping",
        text: "Free worldwide shipping and returns - customs and duties taxes included"
    },
    {
        icon: Headphones,
        title: "Customer Service",
        text: "We are available from monday to friday to answer your questions."
    },
    {
        icon: Lock,
        title: "Secure Payment",
        text: "Your payment information is processed securely."
    },
    {
        icon: Send,
        title: "Contact Us",
        text: "Need to contact us? Just send us an e-mail at info@kevara.com"
    }
];

export default function FooterFeatures() {
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        if (scrollRef.current) {
            const scrollLeft = scrollRef.current.scrollLeft;
            const width = scrollRef.current.offsetWidth;
            const index = Math.round(scrollLeft / width);
            setActiveIndex(index);
        }
    };

    const scrollTo = (index: number) => {
        if (scrollRef.current) {
            const width = scrollRef.current.offsetWidth;
            scrollRef.current.scrollTo({
                left: width * index,
                behavior: "smooth"
            });
            setActiveIndex(index);
        }
    };

    return (
        <div className="border-b border-white/10 bg-[#006D77]">
            <div className="container mx-auto px-4 py-12">
                {/* Mobile: Single Item Slider with Dots */}
                <div className="md:hidden flex flex-col items-center">
                    <div
                        ref={scrollRef}
                        onScroll={handleScroll}
                        className="w-full overflow-x-auto snap-x snap-mandatory flex scrollbar-hide"
                    >
                        {features.map((feature, idx) => (
                            <div
                                key={idx}
                                className="snap-center shrink-0 w-full flex flex-col items-center text-center gap-4 px-4"
                            >
                                <feature.icon size={32} className="text-white mb-2" />
                                <h4 className="text-sm font-bold tracking-widest uppercase text-white">{feature.title}</h4>
                                <p className="text-sm text-gray-300 font-light leading-relaxed max-w-[250px]">
                                    {feature.text}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Dots */}
                    <div className="flex gap-2 mt-8">
                        {features.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => scrollTo(idx)}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${activeIndex === idx ? "bg-white w-2" : "bg-white/30"
                                    }`}
                                aria-label={`Go to slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Desktop: Grid */}
                <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                    {features.map((feature, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-3 group">
                            <div className="p-3 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                                <feature.icon size={24} className="text-white" />
                            </div>
                            <h4 className="text-xs font-bold tracking-widest uppercase text-white">{feature.title}</h4>
                            <p className="text-xs text-gray-300 font-light max-w-[200px] leading-relaxed">
                                {feature.text}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
