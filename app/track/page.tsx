"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
    Search,
    Package,
    Truck,
    CheckCircle,
    Clock,
    MapPin,
    ArrowRight,
    ShoppingBag,
    AlertCircle,
    ExternalLink,
} from "lucide-react";

interface TrackingOrder {
    id: string;
    orderNumber: number;
    status: string;
    financialStatus: string;
    paymentStatus: string;
    totalPrice: string;
    customerInfo: {
        firstName: string;
        lastName: string;
        email: string;
    };
    shippingAddress: {
        name: string;
        address1: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    } | null;
    items: {
        title: string;
        variantTitle: string;
        quantity: number;
        price: string;
    }[];
    courier: string | null;
    awbNumber: string | null;
    trackingUrl: string | null;
    expectedDeliveryDate: string | null;
    createdAt: string;
    updatedAt: string;
}

const timelineSteps = [
    { key: "ordered", label: "Ordered", icon: ShoppingBag },
    { key: "processing", label: "Processing", icon: Package },
    { key: "shipped", label: "Shipped", icon: Truck },
    { key: "delivered", label: "Delivered", icon: CheckCircle },
];

function getActiveStep(status: string): number {
    const s = status?.toLowerCase();
    if (s === "delivered") return 3;
    if (s === "shipped") return 2;
    if (s === "unfulfilled" || s === "processing") return 1;
    return 0;
}

export default function TrackPage() {
    const [orderNumber, setOrderNumber] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [order, setOrder] = useState<TrackingOrder | null>(null);

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderNumber.trim() || !email.trim()) return;

        setLoading(true);
        setError("");
        setOrder(null);

        try {
            const res = await fetch("/api/track", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderNumber: orderNumber.replace("#", ""),
                    email: email.trim(),
                }),
            });

            const data = await res.json();
            if (data.success) {
                setOrder(data.order);
            } else {
                setError(data.error || "Order not found.");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const activeStep = order ? getActiveStep(order.status) : 0;

    return (
        <main className="min-h-screen bg-[#FDFBF7] flex flex-col font-figtree">
            <Navbar />

            <div className="flex-grow">
                {/* Hero */}
                <div className="bg-gradient-to-br from-[#0E4D55] via-[#0A3A40] to-[#072C32] text-white">
                    <div className="container mx-auto px-4 sm:px-6 pt-24 md:pt-32 pb-16 md:pb-20">
                        <div className="max-w-2xl mx-auto text-center">
                            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40 mb-4">
                                Kevara · Order Tracking
                            </p>
                            <h1 className="text-3xl sm:text-4xl font-lora font-light tracking-tight mb-3">
                                Track Your Order
                            </h1>
                            <p className="text-white/50 text-sm max-w-md mx-auto">
                                Enter your order number and email to see the latest status of your Kevara purchase.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search Form */}
                <div className="container mx-auto px-4 sm:px-6 -mt-8">
                    <div className="max-w-xl mx-auto">
                        <form
                            onSubmit={handleLookup}
                            className="bg-white rounded-2xl shadow-lg border border-gray-200/60 p-6 space-y-4"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">
                                        Order Number
                                    </label>
                                    <input
                                        type="text"
                                        value={orderNumber}
                                        onChange={(e) => setOrderNumber(e.target.value)}
                                        placeholder="e.g. 1004"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-[#0E4D55] focus:ring-1 focus:ring-[#0E4D55]/20 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-[#0E4D55] focus:ring-1 focus:ring-[#0E4D55]/20 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0E4D55] text-white text-sm font-medium hover:bg-[#0A3A40] disabled:opacity-50 transition-all"
                            >
                                {loading ? (
                                    <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                                ) : (
                                    <>
                                        <Search size={14} />
                                        Track Order
                                    </>
                                )}
                            </button>
                            {error && (
                                <div className="flex items-center gap-2 text-rose-600 text-sm bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                                    <AlertCircle size={14} />
                                    {error}
                                </div>
                            )}
                        </form>
                    </div>
                </div>

                {/* Order Result */}
                {order && (
                    <div className="container mx-auto px-4 sm:px-6 mt-8 pb-16">
                        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">

                            {/* Order Header */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="font-lora text-xl font-medium text-slate-900">
                                            Order #{order.orderNumber}
                                        </h2>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Placed on{" "}
                                            {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric",
                                            })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-lora text-lg font-medium text-slate-900">
                                            ₹{parseFloat(order.totalPrice || "0").toLocaleString("en-IN")}
                                        </p>
                                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                            order.paymentStatus === "Paid"
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                : "bg-amber-50 text-amber-700 border-amber-200"
                                        }`}>
                                            {order.paymentStatus}
                                        </span>
                                    </div>
                                </div>

                                {/* Visual Timeline */}
                                <div className="relative">
                                    <div className="flex items-center justify-between relative z-10">
                                        {timelineSteps.map((step, idx) => {
                                            const StepIcon = step.icon;
                                            const isComplete = idx <= activeStep;
                                            const isCurrent = idx === activeStep;
                                            return (
                                                <div key={step.key} className="flex flex-col items-center flex-1">
                                                    <div
                                                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                                                            isComplete
                                                                ? isCurrent
                                                                    ? "bg-[#0E4D55] border-[#0E4D55] text-white shadow-lg shadow-[#0E4D55]/20"
                                                                    : "bg-[#0E4D55] border-[#0E4D55] text-white"
                                                                : "bg-gray-100 border-gray-200 text-gray-400"
                                                        }`}
                                                    >
                                                        <StepIcon size={16} />
                                                    </div>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider mt-2 ${
                                                        isComplete ? "text-[#0E4D55]" : "text-gray-400"
                                                    }`}>
                                                        {step.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {/* Progress Line */}
                                    <div className="absolute top-5 left-[12.5%] right-[12.5%] h-0.5 bg-gray-200 -z-0">
                                        <div
                                            className="h-full bg-[#0E4D55] transition-all duration-700 ease-out"
                                            style={{ width: `${(activeStep / (timelineSteps.length - 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Courier Info */}
                            {(order.courier || order.awbNumber) && (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-6">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                                        Shipping Details
                                    </h3>
                                    <div className="space-y-2 text-sm text-slate-700">
                                        {order.courier && (
                                            <p className="flex items-center gap-2">
                                                <Truck size={14} className="text-slate-400" />
                                                <span className="text-slate-400">Courier:</span> {order.courier}
                                            </p>
                                        )}
                                        {order.awbNumber && (
                                            <p className="flex items-center gap-2">
                                                <Package size={14} className="text-slate-400" />
                                                <span className="text-slate-400">Tracking #:</span> {order.awbNumber}
                                            </p>
                                        )}
                                        {order.expectedDeliveryDate && (
                                            <p className="flex items-center gap-2">
                                                <Clock size={14} className="text-slate-400" />
                                                <span className="text-slate-400">Expected:</span>{" "}
                                                {new Date(order.expectedDeliveryDate).toLocaleDateString("en-IN", {
                                                    day: "numeric", month: "long", year: "numeric"
                                                })}
                                            </p>
                                        )}
                                        {order.trackingUrl && (
                                            <a
                                                href={order.trackingUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 rounded-lg bg-[#0E4D55] text-white text-xs font-medium hover:bg-[#0A3A40] transition-colors"
                                            >
                                                Track on {order.courier || "Carrier"} <ExternalLink size={11} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Delivery Address */}
                            {order.shippingAddress && (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-6">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                                        Delivery Address
                                    </h3>
                                    <p className="flex items-start gap-2 text-sm text-slate-700">
                                        <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                                        <span>
                                            {order.shippingAddress.name}<br />
                                            {order.shippingAddress.address1}<br />
                                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}<br />
                                            {order.shippingAddress.country}
                                        </span>
                                    </p>
                                </div>
                            )}

                            {/* Line Items */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-6">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                                    Items Ordered
                                </h3>
                                <div className="divide-y divide-gray-100">
                                    {order.items?.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between py-3">
                                            <div>
                                                <p className="text-sm font-medium text-slate-800">{item.title}</p>
                                                {item.variantTitle && (
                                                    <p className="text-xs text-slate-400 mt-0.5">{item.variantTitle}</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-slate-700">×{item.quantity}</p>
                                                <p className="text-xs text-slate-400">
                                                    ₹{parseFloat(item.price || "0").toLocaleString("en-IN")}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Footer />
        </main>
    );
}
