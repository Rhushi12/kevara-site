"use client";

import { Headphones, Send } from "lucide-react";

const features = [
    {
        icon: Headphones,
        title: "Customer Service",
        text: "We are available from monday to friday to answer your questions."
    },
    {
        icon: Send,
        title: "Contact Us",
        text: "Need to contact us? Just send us an e-mail at info@kevara.com"
    }
];

export default function FooterFeatures() {
    return (
        <div className="border-b border-white/10 bg-[#006D77]">
            <div className="container mx-auto px-4 py-12">
                {/* Two items - centered grid layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto text-center">
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
