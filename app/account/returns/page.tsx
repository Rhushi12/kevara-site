"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Package,
    RotateCcw,
    Clock,
    CheckCircle2,
    XCircle,
    ChevronDown,
    AlertTriangle,
    Loader2,
    ArrowRight,
    ShieldCheck,
    ShieldX,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────
interface ReturnRequest {
    id: string;
    orderId: string;
    orderNumber?: string;
    itemHandle: string;
    reason: string;
    status: "pending" | "approved" | "rejected" | "picked_up" | "refunded";
    returnDays?: number;
    elapsedDays?: number;
    createdAt: string;
    updatedAt?: string;
}

interface OrderItem {
    id: string;
    title: string;
    variantTitle?: string;
    quantity: number;
    price: string;
    image?: string;
    handle?: string;
    sku?: string;
    productId?: string;
}

interface Order {
    id: string;
    orderNumber: string;
    createdAt: string;
    financialStatus: string;
    fulfillmentStatus: string;
    status: string;
    total: string;
    items: OrderItem[];
    awbNumber?: string;
    trackingUrl?: string;
}

// ── Status Config ──────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    pending: {
        label: "Under Review",
        color: "text-amber-600",
        bg: "bg-amber-50 border-amber-200",
        icon: <Clock size={14} className="text-amber-500" />,
    },
    approved: {
        label: "Approved",
        color: "text-emerald-600",
        bg: "bg-emerald-50 border-emerald-200",
        icon: <CheckCircle2 size={14} className="text-emerald-500" />,
    },
    rejected: {
        label: "Rejected",
        color: "text-rose-600",
        bg: "bg-rose-50 border-rose-200",
        icon: <XCircle size={14} className="text-rose-500" />,
    },
    picked_up: {
        label: "Picked Up",
        color: "text-blue-600",
        bg: "bg-blue-50 border-blue-200",
        icon: <Package size={14} className="text-blue-500" />,
    },
    refunded: {
        label: "Refunded",
        color: "text-[#006D77]",
        bg: "bg-[#006D77]/5 border-[#006D77]/20",
        icon: <CheckCircle2 size={14} className="text-[#006D77]" />,
    },
};

// ── Return Reasons ─────────────────────────────────────────
const RETURN_REASONS = [
    "Size doesn't fit",
    "Color different from what was shown",
    "Received a defective/damaged product",
    "Received wrong product",
    "Quality not as expected",
    "Changed my mind",
    "Other",
];

export default function ReturnsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    // Data
    const [orders, setOrders] = useState<Order[]>([]);
    const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Form State
    const [activeTab, setActiveTab] = useState<"requests" | "new">("requests");
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
    const [reason, setReason] = useState("");
    const [customReason, setCustomReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);
    const [orderDropdownOpen, setOrderDropdownOpen] = useState(false);

    // Eligibility State
    const [eligibility, setEligibility] = useState<{
        checked: boolean;
        loading: boolean;
        eligible: boolean;
        reason: string;
        daysRemaining?: number;
        returnDays?: number;
    }>({ checked: false, loading: false, eligible: false, reason: "" });

    // ── Fetch Data ──────────────────────────────────────────
    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.push("/login");
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch orders
                if (user.email) {
                    const ordersRes = await fetch(`/api/orders?email=${encodeURIComponent(user.email)}`);
                    const ordersData = await ordersRes.json();
                    if (ordersData.success) {
                        // Only show delivered/fulfilled orders eligible for returns
                        const eligibleOrders = (ordersData.orders || []).filter(
                            (o: Order) =>
                                o.status?.toLowerCase() === "delivered" ||
                                o.fulfillmentStatus?.toLowerCase() === "fulfilled" ||
                                o.status?.toLowerCase() === "shipped"
                        );
                        setOrders(eligibleOrders);
                    }
                }

                // Fetch existing return requests
                if (user.email) {
                    const returnsRes = await fetch(`/api/returns?email=${encodeURIComponent(user.email)}`);
                    const returnsData = await returnsRes.json();
                    if (returnsData.success) {
                        setReturnRequests(returnsData.requests || []);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user, loading, router]);

    // ── Check Return Eligibility ────────────────────────────
    const checkEligibility = async (order: Order, item: OrderItem) => {
        const itemHandle = item.handle || item.productId || item.title;
        setEligibility({ checked: false, loading: true, eligible: false, reason: "" });

        try {
            const res = await fetch(
                `/api/returns/eligibility?orderId=${encodeURIComponent(order.id)}&itemHandle=${encodeURIComponent(itemHandle)}`
            );
            const data = await res.json();

            setEligibility({
                checked: true,
                loading: false,
                eligible: data.eligible === true,
                reason: data.reason || "",
                daysRemaining: data.daysRemaining,
                returnDays: data.returnDays,
            });
        } catch (err) {
            setEligibility({
                checked: true,
                loading: false,
                eligible: false,
                reason: "Failed to check eligibility. Please try again.",
            });
        }
    };

    // ── Handle Item Selection ───────────────────────────────
    const handleItemSelect = (item: OrderItem) => {
        setSelectedItem(item);
        setReason("");
        setCustomReason("");
        if (selectedOrder) {
            checkEligibility(selectedOrder, item);
        }
    };

    // ── Submit Return Request ───────────────────────────────
    const handleSubmit = async () => {
        if (!selectedOrder || !selectedItem || !reason) return;

        setIsSubmitting(true);
        setSubmitResult(null);

        try {
            const res = await fetch("/api/returns/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId: selectedOrder.id,
                    itemHandle: selectedItem.handle || selectedItem.productId || selectedItem.title,
                    reason: reason === "Other" ? customReason : reason,
                }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setSubmitResult({
                    success: true,
                    message: data.message || "Your return request has been submitted successfully.",
                });
                // Refresh return requests
                if (user?.email) {
                    const returnsRes = await fetch(`/api/returns?email=${encodeURIComponent(user.email)}`);
                    const returnsData = await returnsRes.json();
                    if (returnsData.success) setReturnRequests(returnsData.requests || []);
                }
                // Reset form
                setSelectedOrder(null);
                setSelectedItem(null);
                setReason("");
                setCustomReason("");
            } else {
                setSubmitResult({
                    success: false,
                    message: data.error || "Something went wrong. Please try again.",
                });
            }
        } catch (err: any) {
            setSubmitResult({
                success: false,
                message: "Network error. Please check your connection and try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading || !user) return null;

    return (
        <main className="min-h-screen bg-[#FDFBF7] text-slate-900 font-figtree flex flex-col selection:bg-[#006D77]/20">
            <Navbar />

            <div className="container mx-auto px-4 sm:px-6 pt-32 md:pt-40 pb-24 max-w-4xl flex-1">
                {/* Back Button */}
                <button
                    onClick={() => router.push("/account")}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#006D77] hover:text-[#004e55] transition-colors mb-12"
                >
                    <ArrowLeft size={14} /> Back to Dashboard
                </button>

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-black/5 pb-8">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-prata tracking-tight mb-3 text-slate-900">
                            Returns & Exchanges
                        </h1>
                        <p className="font-lora italic text-slate-500 text-lg">
                            Initiate a return or track the status of an existing request.
                        </p>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-0 mb-10 border-b border-slate-200">
                    <button
                        onClick={() => { setActiveTab("requests"); setSubmitResult(null); }}
                        className={`relative py-4 px-6 text-xs font-bold uppercase tracking-widest transition-colors ${
                            activeTab === "requests"
                                ? "text-[#006D77]"
                                : "text-slate-400 hover:text-slate-600"
                        }`}
                    >
                        My Requests
                        {activeTab === "requests" && (
                            <motion.div
                                layoutId="tab-underline"
                                className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#006D77]"
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                            />
                        )}
                        {returnRequests.length > 0 && (
                            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-[#006D77]/10 text-[#006D77] text-[9px] font-bold rounded-full">
                                {returnRequests.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => { setActiveTab("new"); setSubmitResult(null); }}
                        className={`relative py-4 px-6 text-xs font-bold uppercase tracking-widest transition-colors ${
                            activeTab === "new"
                                ? "text-[#006D77]"
                                : "text-slate-400 hover:text-slate-600"
                        }`}
                    >
                        New Request
                        {activeTab === "new" && (
                            <motion.div
                                layoutId="tab-underline"
                                className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#006D77]"
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                            />
                        )}
                    </button>
                </div>

                {/* ═══════ TAB: MY REQUESTS ═══════ */}
                <AnimatePresence mode="wait">
                    {activeTab === "requests" && (
                        <motion.div
                            key="requests"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.3 }}
                        >
                            {isLoading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="bg-white border border-slate-100 p-8 animate-pulse rounded-sm">
                                            <div className="flex justify-between items-center mb-4">
                                                <div className="h-5 w-40 bg-slate-100 rounded" />
                                                <div className="h-5 w-24 bg-slate-50 rounded" />
                                            </div>
                                            <div className="h-4 w-60 bg-slate-50 rounded" />
                                        </div>
                                    ))}
                                </div>
                            ) : returnRequests.length === 0 ? (
                                <div className="bg-white border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-16 text-center rounded-sm">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <RotateCcw size={24} className="text-slate-300" />
                                    </div>
                                    <h3 className="text-2xl font-prata text-slate-900 mb-3">No Return Requests</h3>
                                    <p className="font-lora italic text-slate-500 max-w-md mx-auto mb-8">
                                        You haven't initiated any returns yet. If you need to return an item, switch to the "New Request" tab.
                                    </p>
                                    <button
                                        onClick={() => setActiveTab("new")}
                                        className="px-8 py-4 bg-[#006D77] text-[#FDFBF7] text-xs font-bold uppercase tracking-widest hover:bg-[#004e55] transition-colors rounded-sm"
                                    >
                                        Initiate a Return
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {returnRequests.map((req, index) => {
                                        const config = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                                        return (
                                            <motion.div
                                                key={req.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.35, delay: index * 0.05 }}
                                                className="bg-white border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden rounded-sm hover:border-slate-200 transition-colors"
                                            >
                                                <div className="p-6 md:p-8">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center">
                                                                <RotateCcw size={14} className="text-slate-400" />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-base font-prata text-slate-900">
                                                                    Order #{req.orderNumber || req.orderId?.slice(-6)}
                                                                </h3>
                                                                <p className="text-xs text-slate-400 font-lora italic mt-0.5">
                                                                    {new Date(req.createdAt).toLocaleDateString("en-US", {
                                                                        month: "long",
                                                                        day: "numeric",
                                                                        year: "numeric",
                                                                    })}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 border rounded-sm text-[10px] font-bold uppercase tracking-widest ${config.bg} ${config.color}`}>
                                                            {config.icon}
                                                            {config.label}
                                                        </div>
                                                    </div>

                                                    <div className="pl-11 space-y-2">
                                                        <div className="flex items-start gap-2">
                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 shrink-0 pt-0.5 w-16">Item</span>
                                                            <span className="text-sm text-slate-700">{req.itemHandle}</span>
                                                        </div>
                                                        <div className="flex items-start gap-2">
                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 shrink-0 pt-0.5 w-16">Reason</span>
                                                            <span className="text-sm text-slate-700">{req.reason}</span>
                                                        </div>
                                                        {req.returnDays && req.elapsedDays !== undefined && (
                                                            <div className="flex items-start gap-2">
                                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 shrink-0 pt-0.5 w-16">Window</span>
                                                                <span className="text-sm text-slate-700">
                                                                    {req.returnDays - req.elapsedDays} day(s) remaining of {req.returnDays}-day policy
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Status Timeline */}
                                                    <div className="mt-6 pt-6 border-t border-slate-50 pl-11">
                                                        <div className="flex items-center gap-0">
                                                            {["pending", "approved", "picked_up", "refunded"].map((step, i) => {
                                                                const stepOrder = ["pending", "approved", "picked_up", "refunded"];
                                                                const currentIndex = stepOrder.indexOf(req.status);
                                                                const isActive = i <= currentIndex;
                                                                const isRejected = req.status === "rejected";

                                                                if (isRejected && i > 0) {
                                                                    if (i === 1) {
                                                                        return (
                                                                            <React.Fragment key={step}>
                                                                                <div className="flex-1 h-[2px] bg-rose-200" />
                                                                                <div className="flex flex-col items-center gap-1.5">
                                                                                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400 ring-2 ring-rose-100" />
                                                                                    <span className="text-[8px] font-bold uppercase tracking-widest text-rose-500">Rejected</span>
                                                                                </div>
                                                                            </React.Fragment>
                                                                        );
                                                                    }
                                                                    return null;
                                                                }

                                                                return (
                                                                    <React.Fragment key={step}>
                                                                        {i > 0 && (
                                                                            <div className={`flex-1 h-[2px] transition-colors duration-500 ${isActive ? "bg-[#006D77]" : "bg-slate-100"}`} />
                                                                        )}
                                                                        <div className="flex flex-col items-center gap-1.5">
                                                                            <div className={`w-2.5 h-2.5 rounded-full transition-colors duration-500 ring-2 ${
                                                                                isActive
                                                                                    ? "bg-[#006D77] ring-[#006D77]/20"
                                                                                    : "bg-slate-200 ring-transparent"
                                                                            }`} />
                                                                            <span className={`text-[8px] font-bold uppercase tracking-widest ${
                                                                                isActive ? "text-[#006D77]" : "text-slate-300"
                                                                            }`}>
                                                                                {STATUS_CONFIG[step]?.label || step}
                                                                            </span>
                                                                        </div>
                                                                    </React.Fragment>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ═══════ TAB: NEW REQUEST ═══════ */}
                    {activeTab === "new" && (
                        <motion.div
                            key="new"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Success/Error Banner */}
                            <AnimatePresence>
                                {submitResult && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, height: 0 }}
                                        animate={{ opacity: 1, y: 0, height: "auto" }}
                                        exit={{ opacity: 0, y: -10, height: 0 }}
                                        className={`mb-8 p-5 border rounded-sm flex items-start gap-3 ${
                                            submitResult.success
                                                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                                : "bg-rose-50 border-rose-200 text-rose-800"
                                        }`}
                                    >
                                        {submitResult.success ? (
                                            <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                                        ) : (
                                            <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                                        )}
                                        <div>
                                            <p className="text-sm font-semibold">{submitResult.success ? "Request Submitted" : "Request Failed"}</p>
                                            <p className="text-xs mt-1 opacity-80">{submitResult.message}</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="bg-white border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] rounded-sm">
                                {/* Policy Banner */}
                                <div className="bg-[#FDFBF7] border-b border-slate-100 px-6 md:px-8 py-5 flex items-start gap-3">
                                    <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-slate-700 mb-1">Return Policy</p>
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            Items can be returned within their specified return window from the date of delivery. 
                                            Products must be unused, unwashed, and in their original packaging with all tags attached.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-6 md:p-8 space-y-8">
                                    {/* ── Step 1: Select Order ── */}
                                    <div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-7 h-7 bg-[#006D77] text-white rounded-full flex items-center justify-center text-[11px] font-bold">1</div>
                                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-700">Select Order</h3>
                                        </div>

                                        {orders.length === 0 && !isLoading ? (
                                            <div className="bg-[#FDFBF7] border border-slate-100 p-8 text-center rounded-sm">
                                                <Package size={28} className="text-slate-300 mx-auto mb-3" />
                                                <p className="text-sm text-slate-500 font-lora italic">
                                                    No eligible orders found. Only delivered orders can be returned.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <button
                                                    onClick={() => setOrderDropdownOpen(!orderDropdownOpen)}
                                                    className={`w-full flex items-center justify-between px-4 py-3.5 bg-white border rounded-sm text-sm transition-all outline-none ${
                                                        orderDropdownOpen 
                                                            ? "border-[#006D77] ring-1 ring-[#006D77]/20" 
                                                            : "border-slate-200 hover:border-slate-300"
                                                    }`}
                                                >
                                                    <span className={selectedOrder ? "text-slate-900 font-medium" : "text-slate-400"}>
                                                        {selectedOrder
                                                            ? `Order #${selectedOrder.orderNumber} — ${new Date(selectedOrder.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                                                            : "Choose an order..."}
                                                    </span>
                                                    <ChevronDown
                                                        size={16}
                                                        className={`text-slate-400 transition-transform ${orderDropdownOpen ? "rotate-180" : ""}`}
                                                    />
                                                </button>

                                                <AnimatePresence>
                                                    {orderDropdownOpen && (
                                                        <>
                                                            <div className="fixed inset-0 z-30" onClick={() => setOrderDropdownOpen(false)} />
                                                            <motion.div
                                                                initial={{ opacity: 0, y: -5, scaleY: 0.95 }}
                                                                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                                                                exit={{ opacity: 0, y: -5, scaleY: 0.95 }}
                                                                transition={{ duration: 0.15 }}
                                                                style={{ transformOrigin: "top" }}
                                                                className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-xl rounded-sm z-40 max-h-64 overflow-y-auto"
                                                            >
                                                                {orders.map((order) => (
                                                                    <button
                                                                        key={order.id}
                                                                        onClick={() => {
                                                                            setSelectedOrder(order);
                                                                            setSelectedItem(null);
                                                                            setOrderDropdownOpen(false);
                                                                        }}
                                                                        className={`w-full text-left px-4 py-3 hover:bg-[#FDFBF7] transition-colors border-b border-slate-50 last:border-0 ${
                                                                            selectedOrder?.id === order.id ? "bg-[#006D77]/5" : ""
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-sm font-medium text-slate-900">
                                                                                Order #{order.orderNumber}
                                                                            </span>
                                                                            <span className="text-xs text-slate-400 font-lora italic">
                                                                                {new Date(order.createdAt).toLocaleDateString("en-US", {
                                                                                    month: "short",
                                                                                    day: "numeric",
                                                                                    year: "numeric",
                                                                                })}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">
                                                                            {order.items?.length || 0} item(s) • ₹{order.total}
                                                                        </p>
                                                                    </button>
                                                                ))}
                                                            </motion.div>
                                                        </>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        )}
                                    </div>

                                    {/* ── Step 2: Select Item ── */}
                                    <AnimatePresence>
                                        {selectedOrder && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-7 h-7 bg-[#006D77] text-white rounded-full flex items-center justify-center text-[11px] font-bold">2</div>
                                                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-700">Select Item to Return</h3>
                                                </div>

                                                <div className="space-y-3">
                                                    {selectedOrder.items?.map((item, i) => (
                                                        <button
                                                            key={item.id || i}
                                                            onClick={() => handleItemSelect(item)}
                                                            className={`w-full flex items-center gap-4 p-4 border rounded-sm text-left transition-all duration-200 ${
                                                                selectedItem?.id === item.id
                                                                    ? "border-[#006D77] bg-[#006D77]/5 ring-1 ring-[#006D77]/20"
                                                                    : "border-slate-200 bg-white hover:border-slate-300"
                                                            }`}
                                                        >
                                                            <div className="w-14 h-18 bg-slate-50 border border-slate-100 flex-shrink-0 overflow-hidden rounded-sm">
                                                                {item.image ? (
                                                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center">
                                                                        <Package size={14} className="text-slate-300" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="text-sm font-medium text-slate-900 line-clamp-1">{item.title}</h4>
                                                                {item.variantTitle && item.variantTitle !== "Default Title" && (
                                                                    <p className="text-xs text-slate-500 font-lora italic mt-0.5">{item.variantTitle}</p>
                                                                )}
                                                                <div className="flex items-center gap-4 mt-1.5">
                                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Qty. {item.quantity}</span>
                                                                    <span className="text-xs font-semibold text-slate-700">₹{item.price}</span>
                                                                </div>
                                                            </div>
                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                                                selectedItem?.id === item.id
                                                                    ? "border-[#006D77] bg-[#006D77]"
                                                                    : "border-slate-300"
                                                            }`}>
                                                                {selectedItem?.id === item.id && (
                                                                    <motion.div
                                                                        initial={{ scale: 0 }}
                                                                        animate={{ scale: 1 }}
                                                                        className="w-2 h-2 rounded-full bg-white"
                                                                    />
                                                                )}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* ── Eligibility Check Banner ── */}
                                    <AnimatePresence>
                                        {selectedItem && eligibility.loading && (
                                            <motion.div
                                                key="eligibility-loading"
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-sm"
                                            >
                                                <Loader2 size={16} className="animate-spin text-slate-400" />
                                                <span className="text-sm text-slate-500">Checking return eligibility...</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <AnimatePresence>
                                        {selectedItem && eligibility.checked && !eligibility.eligible && (
                                            <motion.div
                                                key="eligibility-denied"
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="flex items-start gap-3 p-5 bg-rose-50 border border-rose-200 rounded-sm"
                                            >
                                                <ShieldX size={20} className="text-rose-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-bold text-rose-700">Return Not Available</p>
                                                    <p className="text-xs text-rose-600 mt-1 leading-relaxed">{eligibility.reason}</p>
                                                    <p className="text-[10px] text-rose-400 mt-2 uppercase tracking-widest font-bold">
                                                        Need help? Contact our support team.
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <AnimatePresence>
                                        {selectedItem && eligibility.checked && eligibility.eligible && (
                                            <motion.div
                                                key="eligibility-ok"
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-sm"
                                            >
                                                <ShieldCheck size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-semibold text-emerald-700">Eligible for Return</p>
                                                    <p className="text-xs text-emerald-600 mt-0.5">{eligibility.reason}</p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* ── Step 3: Select Reason (only if eligible) ── */}
                                    <AnimatePresence>
                                        {selectedItem && eligibility.checked && eligibility.eligible && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-7 h-7 bg-[#006D77] text-white rounded-full flex items-center justify-center text-[11px] font-bold">3</div>
                                                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-700">Reason for Return</h3>
                                                </div>

                                                <div className="space-y-2">
                                                    {RETURN_REASONS.map((r) => (
                                                        <button
                                                            key={r}
                                                            onClick={() => setReason(r)}
                                                            className={`w-full text-left px-4 py-3 border rounded-sm text-sm transition-all duration-200 ${
                                                                reason === r
                                                                    ? "border-[#006D77] bg-[#006D77]/5 text-[#006D77] font-medium"
                                                                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                                                            }`}
                                                        >
                                                            {r}
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Custom reason input */}
                                                <AnimatePresence>
                                                    {reason === "Other" && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: "auto" }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                        >
                                                            <textarea
                                                                value={customReason}
                                                                onChange={(e) => setCustomReason(e.target.value)}
                                                                placeholder="Please describe your reason..."
                                                                rows={3}
                                                                className="w-full mt-3 px-4 py-3 border border-slate-200 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-[#006D77] focus:border-[#006D77] bg-white resize-none transition-colors"
                                                            />
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* ── Submit Button ── */}
                                    <AnimatePresence>
                                        {reason && (reason !== "Other" || customReason.trim()) && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="pt-4 border-t border-slate-100"
                                            >
                                                <button
                                                    onClick={handleSubmit}
                                                    disabled={isSubmitting}
                                                    className="w-full md:w-auto flex items-center justify-center gap-2 px-10 py-4 bg-[#006D77] text-[#FDFBF7] text-xs font-bold uppercase tracking-widest hover:bg-[#004e55] transition-colors rounded-sm disabled:opacity-50 disabled:cursor-not-allowed group"
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <Loader2 size={14} className="animate-spin" />
                                                            Processing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            Submit Return Request
                                                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                                        </>
                                                    )}
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <Footer />
        </main>
    );
}
