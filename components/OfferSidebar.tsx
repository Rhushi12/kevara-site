"use client";

import { useOffer } from "@/context/OfferContext";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { X } from "lucide-react";
import OfferSlider from "./OfferSlider";
import { OFFER_SLIDES } from "@/lib/offerData";

export default function OfferSidebar() {
    const { isOpen, closeSidebar, isAdminMode } = useOffer();
    const [slides, setSlides] = useState(OFFER_SLIDES);

    const panelRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const preLayersRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const tl = useRef<gsap.core.Timeline | null>(null);

    // Prevent scrolling
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => { document.body.style.overflow = "unset"; };
    }, [isOpen]);

    // GSAP Animation
    useEffect(() => {
        const ctx = gsap.context(() => {
            const preLayers = preLayersRef.current?.querySelectorAll(".offer-prelayer");

            // Determine mobile state inside effect for responsiveness
            const isMobile = window.innerWidth < 768;

            // Initial Setup
            gsap.set(overlayRef.current, { autoAlpha: 0 });
            gsap.set(contentRef.current, { autoAlpha: 0, y: 20 });

            if (isMobile) {
                // Mobile: Hide at Bottom
                gsap.set(panelRef.current, { yPercent: 100, xPercent: 0 });
                gsap.set(preLayers || [], { yPercent: 100, xPercent: 0 });
            } else {
                // Desktop: Hide at Left (Mirroring QuickView which is Right)
                gsap.set(panelRef.current, { xPercent: -100, yPercent: 0 });
                gsap.set(preLayers || [], { xPercent: -100, yPercent: 0 });
            }

            // Build Timeline
            tl.current = gsap.timeline({ paused: true })
                .to(overlayRef.current, { autoAlpha: 1, duration: 0.3 });

            if (isMobile) {
                // Mobile: Slide Up
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
                // Desktop: Slide Right (from Left)
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

            // Reveal Content
            tl.current.to(contentRef.current, {
                autoAlpha: 1,
                y: 0,
                duration: 0.4,
                ease: "power2.out"
            }, "-=0.2");

        });

        return () => ctx.revert();
    }, []); // Run once on mount to setup, then control via isOpen

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
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm invisible"
            onClick={closeSidebar}
        >
            {/* Pre-layers for staggered effect */}
            {/* 
                Mobile: Bottom-up (Inset-x bottom-0 h-full) 
                Desktop: Left-to-Right (Inset-y left-0 w-[50vw])
                QuickView uses fixed dimensions, here we assume requested responsiveness.
             */}
            <div
                ref={preLayersRef}
                className="absolute inset-x-0 bottom-0 h-[100dvh] md:inset-x-auto md:bottom-auto md:inset-y-0 md:left-0 md:w-[50vw] md:max-w-[600px] pointer-events-none overflow-hidden z-20"
            >
                <div className="offer-prelayer absolute inset-0 bg-[#006D77] z-10" />
                <div className="offer-prelayer absolute inset-0 bg-[#FDFBF7] z-20" />
            </div>

            {/* Main Panel */}
            <div
                ref={panelRef}
                className="relative w-full h-[100dvh] bg-[#FDFBF7] shadow-2xl z-30 flex flex-col md:absolute md:inset-y-0 md:left-0 md:w-[50vw] md:max-w-[600px]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={closeSidebar}
                    className="absolute top-6 right-6 z-50 p-2 bg-black/10 hover:bg-black/20 rounded-full text-white transition-colors backdrop-blur-md"
                >
                    <X size={24} />
                </button>

                {/* Content */}
                <div ref={contentRef} className="w-full h-full opacity-0">
                    <OfferSlider
                        slides={slides}
                        isEditMode={isAdminMode}
                        onUpdate={isAdminMode ? setSlides : undefined}
                    />
                </div>
            </div>
        </div>
    );
}
