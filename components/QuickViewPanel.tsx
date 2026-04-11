"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { X, Minus, Plus, ArrowRight, Box } from "lucide-react";
import Image from "next/image";
import ProductImage from "@/components/ui/ProductImage";
import { useQuickViewStore } from "@/lib/store";
import LiquidButton from "@/components/ui/LiquidButton";
import WholesaleInquiryModal from "@/components/pdp/WholesaleInquiryModal";
import { useCartStore } from "@/lib/cartStore";
import { parseProductTitle } from "@/lib/productUtils";
import { useAuth } from "@/context/AuthContext";

export default function QuickViewPanel() {
    const { isOpen, selectedProduct, closeQuickView } = useQuickViewStore();
    const { openCart, setCart, items } = useCartStore();
    const { user } = useAuth();
    const panelRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const preLayersRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const [quantity, setQuantity] = useState(1);
    const [selectedColor, setSelectedColor] = useState<string>("");
    const [selectedSize, setSelectedSize] = useState<string>("");
    const [showInquiryModal, setShowInquiryModal] = useState(false);

    // Direct Buy Now State
    const [showBuyNowModal, setShowBuyNowModal] = useState(false);
    const [buyNowPhone, setBuyNowPhone] = useState("");
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    const handleDirectCheckout = async () => {
        if (!buyNowPhone || buyNowPhone.length < 10) return;
        setIsCheckingOut(true);

        const mockVariantId = `${selectedProduct?.node.handle}-${selectedSize}-${selectedColor || 'default'}`;
        const item = {
            merchandiseId: mockVariantId,
            quantity: quantity,
            handle: selectedProduct?.node.handle,
            variantTitle: `${selectedSize} / ${selectedColor || 'Default'}`,
        };

        try {
            const response = await fetch('/api/checkout/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    items: [item], 
                    phone: buyNowPhone.trim(),
                    email: user?.email
                })
            });

            const data = await response.json();
            if (data.success && data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            } else {
                alert("Checkout failed: " + data.error);
                setIsCheckingOut(false);
            }
        } catch (error) {
            console.error("Direct checkout failed:", error);
            alert("Something went wrong. Please try again.");
            setIsCheckingOut(false);
        }
    };

    // Reset state when product changes
    useEffect(() => {
        if (selectedProduct) {
            setQuantity(1);
            const node: any = selectedProduct.node;
            const productColors = node.colors || [];
            const rawSizes = node.sizes || ["M"];
            const productSizes = rawSizes.filter((s: string) => s.toLowerCase() !== 'one size');
            
            const hasVariantStock = node.variantStock && Object.keys(node.variantStock).length > 0;
            
            let targetSize = productSizes[0] || "M";
            // Find first available size
            const availableSize = productSizes.find((size: string) => {
                const isOutOfStock = hasVariantStock
                    ? (node.variantStock[size] !== undefined && node.variantStock[size] <= 0)
                    : (node.stock !== undefined && node.stock <= 0);
                return !isOutOfStock;
            });
            
            if (availableSize) targetSize = availableSize;

            setSelectedColor(productColors[0]?.name || "");
            setSelectedSize(targetSize);
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

    const { title, priceRange, images, colors, sizes, handle } = selectedProduct.node;
    const price = priceRange.minVariantPrice.amount;
    const currency = priceRange.minVariantPrice.currencyCode;
    const imageUrl = images.edges[0]?.node.url;

    // Use real colors and sizes from metaobject, fallback to empty arrays
    const productColors = colors || [];
    // Filter out "One Size" - it should never be displayed
    const rawSizes = sizes || ["24", "26", "28", "30", "32", "34", "36", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"];
    const productSizes = rawSizes.filter((s: string) => s.toLowerCase() !== 'one size');

    const node: any = selectedProduct.node;
    const hasVariantStock = node.variantStock && Object.keys(node.variantStock).length > 0;
    const isSelectedOutOfStock = selectedSize ? (hasVariantStock
        ? (node.variantStock[selectedSize] !== undefined && node.variantStock[selectedSize] <= 0)
        : (node.stock !== undefined && node.stock <= 0)) : false;

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
                                <ProductImage
                                    src={imageUrl}
                                    alt={parseProductTitle(title).cleanTitle}
                                    fill
                                    className="object-cover"
                                    containerClassName="absolute inset-0"
                                />
                            )}
                        </div>
                        <div>
                            <h3 className="text-xl font-lora text-slate-900 mb-2">{parseProductTitle(title).cleanTitle}</h3>
                            {/* Price */}
                            <div className="flex items-center gap-3">
                                <span className="text-lg font-figtree font-bold text-slate-900">
                                    {new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(parseFloat(price))}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Selectors */}
                    <div className="space-y-6 mb-8">
                        {/* Color */}
                        {productColors.length > 0 && (
                            <div className="qv-content-item">
                                <label className="block text-xs font-bold tracking-widest uppercase text-slate-900 mb-3">
                                    Color: <span className="text-gray-500 font-normal normal-case">{selectedColor}</span>
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {productColors.map((color) => (
                                        <button
                                            key={color.name}
                                            onClick={() => setSelectedColor(color.name)}
                                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${selectedColor === color.name
                                                ? "border-slate-900 bg-slate-900 text-white"
                                                : "border-slate-200 text-slate-600 hover:border-slate-900 hover:text-slate-900"
                                                }`}
                                        >
                                            {color.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Size */}
                        <div className="qv-content-item">
                            <label className="block text-xs font-bold tracking-widest uppercase text-slate-900 mb-3">
                                Size: <span className="text-gray-500 font-normal normal-case">{selectedSize}</span>
                            </label>
                            <div className="relative">
                                {/* Mobile: Horizontal scroll carousel */}
                                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
                                    {productSizes.map((size) => {
                                        const node: any = selectedProduct.node;
                                        const hasVariantStock = node.variantStock && Object.keys(node.variantStock).length > 0;
                                        const isOutOfStock = hasVariantStock
                                            ? (node.variantStock[size] !== undefined && node.variantStock[size] <= 0)
                                            : (node.stock !== undefined && node.stock <= 0);

                                        return (
                                        <button
                                            key={size}
                                            onClick={() => !isOutOfStock && setSelectedSize(size)}
                                            disabled={isOutOfStock}
                                            className={`relative h-10 min-w-[3rem] px-3 flex items-center justify-center border text-sm font-medium transition-all flex-shrink-0 overflow-hidden ${isOutOfStock
                                                ? "border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50"
                                                : selectedSize === size
                                                    ? "border-slate-900 bg-slate-900 text-white"
                                                    : "border-gray-200 text-slate-900 hover:border-slate-900"
                                                }`}
                                            title={isOutOfStock ? `${size} — Out of Stock` : size}
                                        >
                                            {size}
                                            {isOutOfStock && (
                                                <span className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
                                                    <span className="block w-[140%] h-[1.5px] bg-slate-400 rotate-[-30deg]" />
                                                </span>
                                            )}
                                        </button>
                                    )})}
                                </div>
                                {/* Scroll fade indicator (right edge) */}
                                {productSizes.length > 5 && (
                                    <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
                                )}
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
                        <LiquidButton
                            className="w-full h-12 bg-[#0E4D55] text-white hover:bg-[#0a383f] rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!selectedSize || isSelectedOutOfStock}
                            onClick={() => {
                                if (!selectedSize || isSelectedOutOfStock) return;

                                const mockVariantId = `${handle}-${selectedSize}-${selectedColor || 'default'}`;
                                const existingIndex = items.findIndex((i: any) => i.merchandiseId === mockVariantId);

                                let newItems = [...items];
                                if (existingIndex >= 0) {
                                    newItems[existingIndex].quantity += quantity;
                                } else {
                                    const selectedColorObj = productColors.find((c: any) => c.name === selectedColor);
                                    newItems.push({
                                        id: Date.now().toString(),
                                        merchandiseId: mockVariantId,
                                        title: title,
                                        variantTitle: `${selectedSize} / ${selectedColor || 'Default'}`,
                                        quantity: quantity,
                                        price: price.toString(),
                                        image: imageUrl || "",
                                        colorHex: selectedColorObj?.hex, // Pass hex for cart UI
                                        handle: handle,
                                        availableSizes: productSizes,
                                        availableColors: productColors.map((c: any) => ({
                                            name: c.name,
                                            hex: c.hex,
                                            handle: handle,
                                            image: imageUrl || ""
                                        })),
                                    });
                                }

                                const newSubtotal = newItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0).toFixed(2);
                                setCart(newItems, newSubtotal.toString(), null);

                                // On mobile, close QuickView before opening Cart
                                if (window.innerWidth < 768) {
                                    closeQuickView();
                                    setTimeout(() => openCart(), 300);
                                } else {
                                    openCart();
                                }
                            }}
                        >
                            <span className="font-medium">{!selectedSize ? 'Select a Size' : isSelectedOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
                        </LiquidButton>

                        <button
                            disabled={!selectedSize || isSelectedOutOfStock}
                            className="w-full h-12 bg-[#FDFBF7] text-[#0E4D55] border-2 border-[#0E4D55]/20 hover:border-[#0E4D55] hover:bg-white rounded-lg font-bold uppercase tracking-widest text-xs transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            onClick={() => {
                                if (!selectedSize || isSelectedOutOfStock) return;
                                setShowBuyNowModal(true);
                            }}
                        >
                            {isSelectedOutOfStock ? 'Out of Stock' : 'Buy it Now'}
                        </button>

                        <button
                            onClick={() => setShowInquiryModal(true)}
                            className="text-xs w-full text-slate-500 underline underline-offset-2 hover:text-slate-800 transition-colors mt-2 text-center"
                        >
                            Inquire about wholesale
                        </button>
                    </div>
                </div>
            </div>

            {/* Wholesale Inquiry Modal */}
            <WholesaleInquiryModal
                isOpen={showInquiryModal}
                onClose={() => setShowInquiryModal(false)}
                productTitle={title}
                productHandle={handle || ""}
            />

            {/* Direct Buy Now Modal */}
            {showBuyNowModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="font-prata text-xl text-slate-900">Fast Checkout</h3>
                                <p className="text-xs text-slate-500 font-figtree mt-0.5">Where should we secure your order?</p>
                            </div>
                            <button
                                onClick={() => setShowBuyNowModal(false)}
                                className="p-2 text-slate-400 hover:text-slate-900 bg-white rounded-full border border-gray-100 shadow-sm transition-colors"
                                disabled={isCheckingOut}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6 bg-white">
                            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-gray-100">
                                <div className="w-12 h-16 bg-white border border-gray-200 rounded object-cover flex items-center justify-center shrink-0 overflow-hidden">
                                     {imageUrl ? <img src={imageUrl} alt={title} className="w-full h-full object-cover" /> : <Box size={20} className="text-gray-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-slate-900 truncate">{title}</h4>
                                    <p className="text-xs text-slate-500 capitalize">{selectedSize} {selectedColor ? `/ ${selectedColor}` : ''}</p>
                                    <p className="text-sm font-lora font-medium text-[#0E4D55] mt-1">
                                        ₹{parseFloat(price.toString() || "0").toLocaleString("en-IN")} x {quantity}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[#0E4D55] ml-1">
                                    Delivery Contact Phone <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    value={buyNowPhone}
                                    onChange={(e) => setBuyNowPhone(e.target.value)}
                                    placeholder="e.g. 9876543210"
                                    className={`w-full bg-white border ${buyNowPhone && buyNowPhone.length < 10 ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-[#0E4D55]'} rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-1 transition-all placeholder:font-normal placeholder:text-gray-400`}
                                    autoFocus
                                    disabled={isCheckingOut}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && buyNowPhone.length >= 10 && !isCheckingOut) {
                                            handleDirectCheckout();
                                        }
                                    }}
                                />
                                <p className="text-[10px] text-slate-500 px-1">Required for real-time Delhivery tracking updates.</p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 pt-0 bg-white">
                            <button
                                onClick={handleDirectCheckout}
                                disabled={isCheckingOut || buyNowPhone.length < 10}
                                className="w-full h-12 flex items-center justify-center gap-2 bg-[#0E4D55] text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#0A3A40] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#0E4D55]/20 group"
                            >
                                {isCheckingOut ? (
                                    <span className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
                                ) : (
                                    <>
                                        Continue to Checkout <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

