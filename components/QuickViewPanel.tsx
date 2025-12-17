"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { X, Minus, Plus } from "lucide-react";
import Image from "next/image";
import { useQuickViewStore } from "@/lib/store";
import LiquidButton from "@/components/ui/LiquidButton";

export default function QuickViewPanel() {
    const { isOpen, selectedProduct, closeQuickView } = useQuickViewStore();
    const panelRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const preLayersRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const [quantity, setQuantity] = useState(1);
    const [selectedColor, setSelectedColor] = useState<string>("");
    const [selectedSize, setSelectedSize] = useState<string>("");

    // Reset state when product changes
    useEffect(() => {
        if (selectedProduct) {
            setQuantity(1);
            // Initialize with first available color and size
            const productColors = selectedProduct.node.colors || [];
            const productSizes = selectedProduct.node.sizes || ["M"];
            setSelectedColor(productColors[0]?.name || "");
            setSelectedSize(productSizes[0] || "M");
        }
    }, [selectedProduct]);

    // GSAP Animation
    const tl = useRef<gsap.core.Timeline | null>(null);

    // Initialize Timeline
    useEffect(() => {
        if (!selectedProduct) return;

        const ctx = gsap.context(() => {
            const preLayers = preLayersRef.current?.querySelectorAll(".qv-prelayer");
            const contentItems = contentRef.current?.querySelectorAll(".qv-content-item");

            // Initial States
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
    }, [selectedProduct]);

    // Control Animation
    useEffect(() => {
        if (isOpen) {
            tl.current?.play();
        } else {
            tl.current?.reverse();
        }
    }, [isOpen]);

    if (!selectedProduct) return null;

    const { title, priceRange, images, colors, sizes } = selectedProduct.node;
    const price = priceRange.minVariantPrice.amount;
    const currency = priceRange.minVariantPrice.currencyCode;
    const imageUrl = images.edges[0]?.node.url;

    // Use real colors and sizes from metaobject, fallback to empty arrays
    const productColors = colors || [];
    const productSizes = sizes || ["XS", "S", "M", "L", "XL"]; // Fallback if no sizes

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm invisible flex items-end md:block"
            onClick={closeQuickView}
        >
            {/* Pre-layers for staggered effect */}
            {/* Mobile: Inset-x bottom-0 h-[85vh] | Desktop: Inset-y right-0 w-[480px] */}
            <div ref={preLayersRef} className="absolute inset-x-0 bottom-0 h-[85vh] rounded-t-2xl md:rounded-none md:inset-x-auto md:inset-y-0 md:right-0 md:h-full md:w-[480px] pointer-events-none overflow-hidden z-20">
                <div className="qv-prelayer absolute inset-0 bg-[#006D77] z-10" /> {/* Teal */}
                <div className="qv-prelayer absolute inset-0 bg-[#FDFBF7] z-20" /> {/* Cream */}
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
                        <h2 className="text-xl font-lora italic text-slate-900">Choose options</h2>
                        <button
                            onClick={closeQuickView}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-slate-900"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Product Summary */}
                    <div className="qv-content-item flex gap-6 mb-8">
                        <div className="relative w-24 aspect-[3/4] bg-gray-100 rounded-sm overflow-hidden shrink-0">
                            {imageUrl && (
                                <Image
                                    src={imageUrl}
                                    alt={title}
                                    fill
                                    className="object-cover"
                                />
                            )}
                        </div>
                        <div>
                            <h3 className="text-xl font-lora text-slate-900 mb-2">{title}</h3>
                            {/* Price */}
                            <div className="flex items-center gap-3">
                                <span className="text-lg font-figtree font-bold text-slate-900">
                                    {new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(parseFloat(price))}
                                </span>
                                <span className="text-sm font-figtree text-gray-400 line-through">
                                    {new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(parseFloat(price) * 1.2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Selectors */}
                    <div className="space-y-6 mb-8">
                        {/* Color */}
                        <div className="qv-content-item">
                            <label className="block text-xs font-bold tracking-widest uppercase text-slate-900 mb-3">
                                Color: <span className="text-gray-500 font-normal normal-case">{selectedColor}</span>
                            </label>
                            <div className="flex flex-wrap gap-3">
                                {productColors.map((color) => (
                                    <button
                                        key={color.name}
                                        onClick={() => setSelectedColor(color.name)}
                                        className={`w-8 h-8 rounded-full border transition-all ${selectedColor === color.name
                                            ? "border-slate-900 ring-1 ring-slate-900 ring-offset-2"
                                            : "border-gray-200 hover:border-gray-400"
                                            }`}
                                        style={{ backgroundColor: color.hex }}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Size */}
                        <div className="qv-content-item">
                            <label className="block text-xs font-bold tracking-widest uppercase text-slate-900 mb-3">
                                Size: <span className="text-gray-500 font-normal normal-case">{selectedSize}</span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {productSizes.map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => setSelectedSize(size)}
                                        className={`min-w-[3rem] h-10 px-3 flex items-center justify-center border text-sm font-medium transition-all ${selectedSize === size
                                            ? "border-slate-900 bg-slate-900 text-white"
                                            : "border-gray-200 text-slate-900 hover:border-slate-900"
                                            }`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quantity */}
                        <div className="qv-content-item">
                            <label className="block text-xs font-bold tracking-widest uppercase text-slate-900 mb-3">
                                Quantity
                            </label>
                            <div className="flex items-center w-32 border border-gray-200">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-10 h-10 flex items-center justify-center text-slate-900 hover:bg-gray-50"
                                >
                                    <Minus size={16} />
                                </button>
                                <div className="flex-1 text-center text-sm font-medium text-slate-900">
                                    {quantity}
                                </div>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="w-10 h-10 flex items-center justify-center text-slate-900 hover:bg-gray-50"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-auto space-y-3 qv-content-item">
                        {/* <LiquidButton
                            className="w-full bg-[#25D366] text-white hover:bg-[#128C7E] border-none"
                            onClick={() => {
                                window.open(`https://wa.me/919876543210?text=Hi, I'm interested in ${title} (Color: ${selectedColor}, Size: ${selectedSize})`, '_blank');
                                closeQuickView();
                            }}
                        >
                            Chat with WhatsApp
                        </LiquidButton> */}
                        <LiquidButton
                            className="w-full"
                            variant="secondary"
                            onClick={() => {
                                window.location.href = `mailto:contact@kevara.com?subject=Inquiry about ${title}&body=I'm interested in ${title} (Color: ${selectedColor}, Size: ${selectedSize})`;
                                closeQuickView();
                            }}
                        >
                            Send us an Email
                        </LiquidButton>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper functions (reused from ProductCard logic)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractColors(product: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return product.node.variants.edges.map((v: any) => {
        const parts = v.node.title.split("/");
        return parts.length > 1 ? parts[1].trim() : "Default";
    });
}

function getColorHex(name: string) {
    const map: Record<string, string> = {
        Blue: "#1E3A8A",
        Red: "#B91C1C",
        Beige: "#D4D4D8",
        Black: "#18181B",
        Grey: "#71717A",
        Brown: "#78350F",
        White: "#FFFFFF",
        Green: "#064E3B",
        Khaki: "#C2B280",
        Navy: "#0F172A",
        Cream: "#FFFDD0",
        Default: "#000000",
    };
    return map[name] || "#000000";
}
