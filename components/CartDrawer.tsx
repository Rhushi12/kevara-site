"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/cartStore";
import { ShoppingBag, X, Minus, Plus, ArrowRight, ChevronDown, Tag } from "lucide-react";
import Image from "next/image";
import LiquidButton from "./ui/LiquidButton";
import { motion, AnimatePresence } from "framer-motion";
import { parseProductTitle } from '@/lib/productUtils';
import { useAuth } from '@/context/AuthContext';

export default function CartDrawer() {
    const { isCartOpen, closeCart, items, subtotal, checkoutUrl, cartCount, updateItemQuantity, updateItemVariant, removeItem } = useCartStore();

    // Use an internal mounted state to handle SSR hydration cleanly
    const [mounted, setMounted] = useState(false);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    // Coupon State
    const [isCouponOpen, setIsCouponOpen] = useState(false);
    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);



    // Auth — for auto-applying welcome discount and checking auth status
    const { isFirstPurchase, user } = useAuth();

    // Auto-apply WELCOME10 for first-time buyers
    useEffect(() => {
        if (isFirstPurchase && !appliedCoupon && isCartOpen) {
            setCouponCode("WELCOME10");
            setAppliedCoupon("WELCOME10");
            setIsCouponOpen(true);
        }
    }, [isFirstPurchase, isCartOpen]);

    // Checkout State
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    const handleCheckout = async () => {
        if (items.length === 0) return;

        // AUTHENTICATION CHECK: Prevent guest checkout
        if (!user) {
            closeCart();
            window.location.href = "/login?redirect=checkout";
            return;
        }

        setIsCheckingOut(true);

        try {
            const checkoutItems = items.map(item => ({
                merchandiseId: item.merchandiseId || item.id,
                quantity: item.quantity || 1,
                handle: item.handle,
                variantTitle: item.variantTitle
            }));

            const response = await fetch('/api/checkout/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    items: checkoutItems, 
                    discountCode: appliedCoupon || undefined,
                    email: user.email
                })
            });

            const data = await response.json();

            if (data.success && data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            } else {
                console.error("Checkout failed:", data);
                alert(data.error || "Sorry, there was an issue creating the checkout. Please try again.");
                setIsCheckingOut(false);
            }
        } catch (error) {
            console.error("Checkout exception:", error);
            alert("A network error occurred. Please try again.");
            setIsCheckingOut(false);
        }
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent body scroll when cart is open
    useEffect(() => {
        if (typeof window !== "undefined") {
            if (isCartOpen) {
                document.body.style.overflow = "hidden";
            } else {
                document.body.style.overflow = "unset";
            }
        }
    }, [isCartOpen]);

    if (!mounted) return null;

    return (
        <>
            {/* Backdrop Overlay */}
            <div
                className={`fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-out ${isCartOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                    }`}
                onClick={closeCart}
            />

            {/* Drawer Container */}
            <div
                className={`fixed inset-y-0 right-0 z-[95] w-full sm:w-[420px] flex justify-end pointer-events-none`}
            >
                {/* Pre-layer 1: Teal */}
                <div
                    className={`absolute inset-0 bg-[#0E4D55] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-10 ${isCartOpen ? "translate-x-0 delay-0" : "translate-x-full delay-150"
                        }`}
                />

                {/* Pre-layer 2: Cream */}
                <div
                    className={`absolute inset-0 bg-[#FDFBF7] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-20 ${isCartOpen ? "translate-x-0 delay-75" : "translate-x-full delay-75"
                        }`}
                />

                {/* Main Panel */}
                <div
                    className={`relative w-full h-full bg-white shadow-2xl z-30 flex flex-col pointer-events-auto transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isCartOpen ? "translate-x-0 delay-150" : "translate-x-full delay-0"
                        }`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className={`flex items-center justify-between p-6 border-b border-gray-100 transition-all duration-500 ease-out ${isCartOpen ? "opacity-100 translate-y-0 delay-[250ms]" : "opacity-0 translate-y-4 delay-0"
                        }`}>
                        <div className="flex items-center gap-3">
                            <ShoppingBag size={20} className="text-[#0E4D55]" />
                            <h2 className="text-xl font-lora font-medium text-slate-900">Your Cart</h2>
                            <span className="bg-gray-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
                                {cartCount}
                            </span>
                        </div>
                        <button
                            onClick={closeCart}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-slate-900"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content Container */}
                    <div className={`flex-1 overflow-hidden flex flex-col transition-all duration-500 ease-out ${isCartOpen ? "opacity-100 translate-y-0 delay-[300ms]" : "opacity-0 translate-y-4 delay-0"
                        }`}>
                        {/* Cart Items (Empty vs Filled) */}
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                            {items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                                        <ShoppingBag size={32} />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-lora text-slate-900">Your cart is empty</h3>
                                        <p className="text-sm font-figtree text-gray-500 max-w-[250px] mx-auto">
                                            Looks like you haven't added any elegant pieces to your collection yet.
                                        </p>
                                    </div>
                                    <LiquidButton onClick={closeCart} className="mt-4 px-8 py-3 bg-[#0E4D55] text-white">
                                        Start Shopping
                                    </LiquidButton>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <AnimatePresence initial={false}>
                                        {items.map((item) => (
                                            <motion.div
                                                key={item.id}
                                                layout
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                                                transition={{ duration: 0.25, ease: "easeOut" }}
                                                className="flex gap-4 group"
                                            >
                                                {/* Item Image */}
                                                <div className="relative w-20 h-28 bg-gray-50 rounded-md overflow-hidden flex-shrink-0">
                                                    {item.image ? (
                                                        <Image
                                                            src={item.image}
                                                            alt={item.title}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                            <ShoppingBag size={16} />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Item Details */}
                                                <div className="flex-1 flex flex-col justify-between py-1">
                                                    <div>
                                                        <div className="flex justify-between items-start gap-2">
                                                            <h4 className="text-sm font-medium text-slate-900 line-clamp-2">
                                                                {parseProductTitle(item.title).cleanTitle}
                                                            </h4>
                                                            <span className="text-sm font-bold text-slate-900 shrink-0">
                                                                ₹{parseFloat(item.price).toFixed(2)}
                                                            </span>
                                                        </div>
                                                        {/* Visual Variant Display & Quantity */}
                                                        {item.variantTitle && item.variantTitle !== "Default Title" && (
                                                            <div className="flex flex-wrap items-center gap-3 mt-2">
                                                                <div className="flex items-center gap-2">
                                                                    {/* Color Dropdown (if available) */}
                                                                    {item.availableColors && item.availableColors.length > 0 ? (
                                                                        <div className="relative">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setOpenDropdownId(openDropdownId === `${item.id}-color` ? null : `${item.id}-color`)}
                                                                                className="flex items-center gap-2 px-2 py-1 bg-white border border-gray-200 rounded-md hover:border-gray-300 transition-colors"
                                                                            >
                                                                                <div
                                                                                    className="w-3.5 h-3.5 rounded-full border border-gray-200 shadow-sm"
                                                                                    style={{ backgroundColor: item.colorHex || '#000' }}
                                                                                />
                                                                                <ChevronDown size={12} className={`text-slate-400 transition-transform ${openDropdownId === `${item.id}-color` ? 'rotate-180' : ''}`} />
                                                                            </button>

                                                                            <AnimatePresence>
                                                                                {openDropdownId === `${item.id}-color` && (
                                                                                    <>
                                                                                        <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownId(null)} />
                                                                                        <motion.div
                                                                                            initial={{ opacity: 0, y: -5, scale: 0.95 }}
                                                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                                            exit={{ opacity: 0, y: -5, scale: 0.95 }}
                                                                                            transition={{ duration: 0.15, ease: "easeOut" }}
                                                                                            className="absolute top-full left-0 mt-1 w-32 bg-white border border-gray-100 shadow-xl rounded-lg py-1 z-50 overflow-hidden"
                                                                                        >
                                                                                            {item.availableColors.map((c) => (
                                                                                                <button
                                                                                                    key={c.hex}
                                                                                                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 transition-colors group/opt"
                                                                                                    onClick={() => {
                                                                                                        const parts = item.variantTitle.split(' / ');
                                                                                                        const sizePart = parts.length > 1 ? parts[0] : "";
                                                                                                        const newVariantTitle = sizePart ? `${sizePart} / ${c.name}` : c.name;
                                                                                                        const newVariantId = `${item.handle || 'prod'}-${sizePart?.trim()}-${c.name}`;

                                                                                                        updateItemVariant(item.id, {
                                                                                                            variantTitle: newVariantTitle,
                                                                                                            colorHex: c.hex,
                                                                                                            merchandiseId: newVariantId,
                                                                                                            image: c.image || item.image
                                                                                                        });
                                                                                                        setOpenDropdownId(null);
                                                                                                    }}
                                                                                                >
                                                                                                    <div
                                                                                                        className="w-4 h-4 rounded-full border border-gray-200 shadow-sm"
                                                                                                        style={{ backgroundColor: c.hex }}
                                                                                                    />
                                                                                                    <span className="text-xs font-medium text-slate-700 group-hover/opt:text-slate-900 truncate">
                                                                                                        {c.name}
                                                                                                    </span>
                                                                                                </button>
                                                                                            ))}
                                                                                        </motion.div>
                                                                                    </>
                                                                                )}
                                                                            </AnimatePresence>
                                                                        </div>
                                                                    ) : item.colorHex ? (
                                                                        <div
                                                                            className="w-5 h-5 rounded-full border border-gray-200 shadow-sm shrink-0"
                                                                            style={{ backgroundColor: item.colorHex }}
                                                                            title={item.variantTitle.split(' / ')[1] || item.variantTitle}
                                                                        />
                                                                    ) : null}

                                                                    {/* Size Dropdown */}
                                                                    {item.availableSizes && item.availableSizes.length > 0 ? (
                                                                        <div className="relative">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setOpenDropdownId(openDropdownId === `${item.id}-size` ? null : `${item.id}-size`)}
                                                                                className="flex items-center gap-1.5 pl-2 pr-1.5 py-1 bg-white border border-gray-200 rounded-md hover:border-gray-300 transition-colors"
                                                                            >
                                                                                <span className="text-[10px] font-bold tracking-wider text-slate-700 uppercase">
                                                                                    {item.variantTitle.split(' / ')[0]}
                                                                                </span>
                                                                                <ChevronDown size={12} className={`text-slate-400 transition-transform ${openDropdownId === `${item.id}-size` ? 'rotate-180' : ''}`} />
                                                                            </button>

                                                                            <AnimatePresence>
                                                                                {openDropdownId === `${item.id}-size` && (
                                                                                    <>
                                                                                        <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownId(null)} />
                                                                                        <motion.div
                                                                                            initial={{ opacity: 0, y: -5, scale: 0.95 }}
                                                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                                            exit={{ opacity: 0, y: -5, scale: 0.95 }}
                                                                                            transition={{ duration: 0.15, ease: "easeOut" }}
                                                                                            className="absolute top-full left-0 mt-1 w-20 max-h-40 overflow-y-auto scrollbar-hide bg-white border border-gray-100 shadow-xl rounded-lg py-1 z-50"
                                                                                        >
                                                                                            {item.availableSizes.map((s) => {
                                                                                                const hasVariantStock = item.variantStock && Object.keys(item.variantStock).length > 0;
                                                                                                const isOutOfStock = hasVariantStock
                                                                                                    ? (item.variantStock![s] !== undefined && item.variantStock![s] <= 0)
                                                                                                    : (item.stock !== undefined && item.stock <= 0);

                                                                                                return (
                                                                                                    <button
                                                                                                        key={s}
                                                                                                        disabled={isOutOfStock}
                                                                                                        className={`relative w-full text-center px-3 py-2 text-[10px] font-bold tracking-wider uppercase transition-colors overflow-hidden ${
                                                                                                            isOutOfStock 
                                                                                                                ? 'text-slate-300 cursor-not-allowed bg-slate-50' 
                                                                                                                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                                                                                                        }`}
                                                                                                        onClick={() => {
                                                                                                            if (isOutOfStock) return;
                                                                                                            const parts = item.variantTitle.split(' / ');
                                                                                                            const colorPart = parts.length > 1 ? parts[1] : null;
                                                                                                            const newVariantTitle = colorPart ? `${s} / ${colorPart.trim()}` : s;
                                                                                                            const newVariantId = `${item.handle || 'prod'}-${s}-${colorPart ? colorPart.trim() : 'default'}`;

                                                                                                            updateItemVariant(item.id, {
                                                                                                                variantTitle: newVariantTitle,
                                                                                                                merchandiseId: newVariantId
                                                                                                            });
                                                                                                            setOpenDropdownId(null);
                                                                                                        }}
                                                                                                    >
                                                                                                        {s}
                                                                                                        {isOutOfStock && (
                                                                                                            <span
                                                                                                                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                                                                                                aria-hidden="true"
                                                                                                            >
                                                                                                                <span className="block w-[140%] h-[1.5px] bg-slate-400 rotate-[-15deg]" />
                                                                                                            </span>
                                                                                                        )}
                                                                                                    </button>
                                                                                                );
                                                                                            })}
                                                                                        </motion.div>
                                                                                    </>
                                                                                )}
                                                                            </AnimatePresence>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded border border-gray-200 text-[10px] font-bold tracking-wider text-slate-700 uppercase shrink-0">
                                                                            {item.variantTitle.split(' / ')[0]}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {/* Quantity Stepper Moved Here */}
                                                                <div className="flex items-center border border-gray-200 rounded-md bg-white">
                                                                    <button
                                                                        onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                                                                        className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-slate-900 hover:bg-gray-50 transition-colors"
                                                                    >
                                                                        <Minus size={10} />
                                                                    </button>
                                                                    <span className="text-[10px] font-medium w-6 text-center">{item.quantity}</span>
                                                                    <button
                                                                        onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                                                                        className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-slate-900 hover:bg-gray-50 transition-colors"
                                                                    >
                                                                        <Plus size={10} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center justify-end mt-2">
                                                        <button
                                                            onClick={() => removeItem(item.id)}
                                                            className="text-[10px] text-gray-400 hover:text-red-500 underline underline-offset-2 transition-colors uppercase tracking-wider font-semibold"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        {/* Footer (Checkout) */}
                        {items.length > 0 && (
                            <div className="border-t border-gray-100 p-6 bg-gray-50/50 flex flex-col pt-0">

                                {/* Promo Code Accordion */}
                                <div className="border-b border-gray-200 py-4 mb-4">
                                    <button
                                        onClick={() => setIsCouponOpen(!isCouponOpen)}
                                        className="flex items-center justify-between w-full text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Tag size={14} className="text-slate-400" />
                                            <span>Add a promo code</span>
                                        </div>
                                        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isCouponOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {isCouponOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                                animate={{ height: "auto", opacity: 1, marginTop: 12 }}
                                                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={couponCode}
                                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                        placeholder="Enter code"
                                                        className="flex-1 bg-white border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0E4D55] font-mono placeholder:font-sans"
                                                        disabled={!!appliedCoupon}
                                                    />
                                                    {appliedCoupon ? (
                                                        <button
                                                            onClick={() => {
                                                                setAppliedCoupon(null);
                                                                setCouponCode("");
                                                            }}
                                                            className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-md text-sm font-medium hover:bg-red-100 transition-colors"
                                                        >
                                                            Remove
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                if (!couponCode) return;
                                                                setAppliedCoupon(couponCode);
                                                            }}
                                                            className="px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                                                            disabled={!couponCode}
                                                        >
                                                            Apply
                                                        </button>
                                                    )}
                                                </div>
                                                {appliedCoupon && (
                                                    <p className="text-xs text-[#006D77] font-medium mt-2 flex items-center gap-1">
                                                        ✓ Code &quot;{appliedCoupon}&quot; will be applied at checkout
                                                    </p>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-sm text-slate-600 mt-4">
                                        <span>Subtotal</span>
                                        <span className="font-medium text-slate-900">₹{subtotal}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-slate-600">
                                        <span>Shipping & Taxes</span>
                                        <span>Calculated at checkout</span>
                                    </div>
                                    <div className="border-t border-gray-200 pt-3 flex justify-between">
                                        <span className="font-bold text-slate-900">Total</span>
                                        <span className="font-bold text-slate-900 text-xl">₹{subtotal}</span>
                                    </div>
                                </div>

                                <LiquidButton
                                    onClick={handleCheckout}
                                    className="w-full py-4 bg-[#0E4D55] text-white hover:bg-[#0A3A40] shadow-lg shadow-[#0E4D55]/20 group disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isCheckingOut || items.length === 0}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="font-semibold tracking-wide">
                                            {isCheckingOut ? "Creating Checkout..." : "Proceed to Checkout"}
                                        </span>
                                        <motion.div
                                            variants={{
                                                idle: { x: 0 },
                                                hover: {
                                                    x: [0, 4, 0],
                                                    transition: {
                                                        repeat: Infinity,
                                                        duration: 1,
                                                        ease: "easeInOut"
                                                    }
                                                }
                                            }}
                                            initial="idle"
                                            animate={isCartOpen ? "idle" : "idle"}
                                            whileHover="hover"
                                            className="flex"
                                        >
                                            <ArrowRight size={16} className="group-hover:text-white/90" />
                                        </motion.div>
                                    </div>
                                </LiquidButton>

                                <p className="text-center text-[10px] text-gray-400 mt-4 uppercase tracking-widest font-medium">
                                    Secure checkout via Shopify
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
