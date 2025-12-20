"use client";

import { useOffer } from "@/context/OfferContext";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { X, Save, Loader2 } from "lucide-react";
import OfferSlider from "./OfferSlider";
import { OFFER_SLIDES } from "@/lib/offerData";
import { useToast } from "@/context/ToastContext";

export default function OfferSidebar() {
    const { isOpen, closeSidebar, isAdminMode } = useOffer();
    const [slides, setSlides] = useState(OFFER_SLIDES);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { showToast } = useToast();

    const panelRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const preLayersRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const tl = useRef<gsap.core.Timeline | null>(null);

    // Fetch offer slides from API on mount
    useEffect(() => {
        async function fetchOfferSlides() {
            try {
                const res = await fetch("/api/offer");
                const data = await res.json();
                if (data.slides && data.slides.length > 0) {
                    setSlides(data.slides);
                }
            } catch (error) {
                console.error("[OfferSidebar] Failed to fetch slides:", error);
                // Keep default slides on error
            } finally {
                setIsLoading(false);
            }
        }
        fetchOfferSlides();
    }, []);

    // Save handler for admin mode
    const handleSaveSlides = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/offer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slides }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to save");
            }

            showToast("Offer slides saved successfully!", "success");
        } catch (error: any) {
            console.error("[OfferSidebar] Failed to save slides:", error);
            showToast("Failed to save offer slides: " + error.message, "error");
        } finally {
            setIsSaving(false);
        }
    };

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

                {/* Save Button (Admin Mode) */}
                {isAdminMode && (
                    <button
                        onClick={handleSaveSlides}
                        disabled={isSaving}
                        className="absolute top-6 right-20 z-50 px-4 py-2 bg-[#006D77] hover:bg-[#005a63] rounded-full text-white transition-colors flex items-center gap-2 text-sm font-medium shadow-lg disabled:opacity-50"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                Save Changes
                            </>
                        )}
                    </button>
                )}

                {/* Content */}
                <div ref={contentRef} className="w-full h-full opacity-0">
                    {isLoading ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <Loader2 size={32} className="animate-spin text-[#006D77]" />
                        </div>
                    ) : (
                        <OfferSlider
                            slides={slides}
                            isEditMode={isAdminMode}
                            onUpdate={isAdminMode ? setSlides : undefined}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

