"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { X } from "lucide-react";
import { useSizeGuideStore } from "@/lib/store";

export default function SizeGuidePanel() {
    const { isOpen, closeSizeGuide } = useSizeGuideStore();
    const panelRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const preLayersRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // GSAP Animation
    const tl = useRef<gsap.core.Timeline | null>(null);

    // Initialize Timeline
    useEffect(() => {
        const ctx = gsap.context(() => {
            const preLayers = preLayersRef.current?.querySelectorAll(".qv-prelayer");
            const contentItems = contentRef.current?.querySelectorAll(".qv-content-item");

            // Check if mobile
            const isMobile = window.innerWidth < 768;

            // Initial States
            gsap.set(overlayRef.current, { autoAlpha: 0 });

            if (isMobile) {
                gsap.set(panelRef.current, { yPercent: 100, xPercent: 0 });
                gsap.set(preLayers || [], { yPercent: 100, xPercent: 0 });
            } else {
                gsap.set(panelRef.current, { xPercent: 100, yPercent: 0 });
                gsap.set(preLayers || [], { xPercent: 100, yPercent: 0 });
            }

            gsap.set(contentItems || [], { y: 20, autoAlpha: 0 });

            // Build Timeline
            tl.current = gsap.timeline({ paused: true })
                .to(overlayRef.current, { autoAlpha: 1, duration: 0.3 });

            if (isMobile) {
                // Mobile Animation (Bottom to Top)
                tl.current
                    .to(preLayers || [], {
                        yPercent: 0,
                        duration: 0.5,
                        stagger: 0.1,
                        ease: "power4.out"
                    }, "-=0.2")
                    .to(panelRef.current, {
                        yPercent: 0,
                        duration: 0.6,
                        ease: "power4.out"
                    }, "-=0.4");
            } else {
                // Desktop Animation (Right to Left)
                tl.current
                    .to(preLayers || [], {
                        xPercent: 0,
                        duration: 0.5,
                        stagger: 0.1,
                        ease: "power4.out"
                    }, "-=0.2")
                    .to(panelRef.current, {
                        xPercent: 0,
                        duration: 0.6,
                        ease: "power4.out"
                    }, "-=0.4");
            }

            tl.current.to(contentItems || [], {
                y: 0,
                autoAlpha: 1,
                duration: 0.4,
                stagger: 0.05,
                ease: "power2.out"
            }, "-=0.2");
        });

        return () => ctx.revert();
    }, []);

    // Control Animation
    useEffect(() => {
        if (isOpen) {
            tl.current?.play();
        } else {
            tl.current?.reverse();
        }
    }, [isOpen]);

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm invisible flex items-end md:block"
            onClick={closeSizeGuide}
        >
            {/* Pre-layers for staggered effect */}
            <div ref={preLayersRef} className="absolute inset-x-0 bottom-0 h-[85vh] rounded-t-2xl md:rounded-none md:inset-x-auto md:inset-y-0 md:right-0 md:h-full md:w-[480px] pointer-events-none overflow-hidden z-20">
                <div className="qv-prelayer absolute inset-0 bg-[#006D77] z-10" />
                <div className="qv-prelayer absolute inset-0 bg-[#FDFBF7] z-20" />
            </div>

            {/* Main Panel */}
            <div
                ref={panelRef}
                className="relative w-full h-[85vh] bg-white shadow-2xl z-30 flex flex-col rounded-t-2xl md:absolute md:inset-y-0 md:right-0 md:w-[480px] md:h-full md:rounded-none"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div ref={contentRef} className="flex flex-col h-full p-8 overflow-y-auto">
                    <div className="qv-content-item flex justify-between items-center mb-8">
                        <h2 className="text-xl font-lora italic text-slate-900">Size Guide</h2>
                        <button
                            onClick={closeSizeGuide}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-slate-900"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Size Chart Content */}
                    <div className="qv-content-item space-y-8">
                        <p className="text-sm text-slate-600">
                            Use this chart to find your perfect fit. Measurements are in inches.
                        </p>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-slate-600">
                                <thead className="text-xs text-slate-900 uppercase bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3">Size</th>
                                        <th className="px-4 py-3">Bust</th>
                                        <th className="px-4 py-3">Waist</th>
                                        <th className="px-4 py-3">Hips</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b">
                                        <td className="px-4 py-3 font-medium text-slate-900">XS</td>
                                        <td className="px-4 py-3">32-33</td>
                                        <td className="px-4 py-3">24-25</td>
                                        <td className="px-4 py-3">34-35</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="px-4 py-3 font-medium text-slate-900">S</td>
                                        <td className="px-4 py-3">34-35</td>
                                        <td className="px-4 py-3">26-27</td>
                                        <td className="px-4 py-3">36-37</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="px-4 py-3 font-medium text-slate-900">M</td>
                                        <td className="px-4 py-3">36-37</td>
                                        <td className="px-4 py-3">28-29</td>
                                        <td className="px-4 py-3">38-39</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="px-4 py-3 font-medium text-slate-900">L</td>
                                        <td className="px-4 py-3">38-39</td>
                                        <td className="px-4 py-3">30-31</td>
                                        <td className="px-4 py-3">40-41</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="px-4 py-3 font-medium text-slate-900">XL</td>
                                        <td className="px-4 py-3">40-41</td>
                                        <td className="px-4 py-3">32-33</td>
                                        <td className="px-4 py-3">42-43</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium text-slate-900 mb-2">How to Measure</h4>
                            <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
                                <li><strong>Bust:</strong> Measure around the fullest part of your bust.</li>
                                <li><strong>Waist:</strong> Measure around your natural waistline.</li>
                                <li><strong>Hips:</strong> Measure around the fullest part of your hips.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
