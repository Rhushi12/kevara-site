"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import {
    Search,
    Package,
    Truck,
    CheckCircle,
    Clock,
    MapPin,
    ExternalLink,
    AlertCircle,
    ShoppingBag,
    ArrowRight
} from "lucide-react";

interface TrackingOrder {
    id: string;
    orderNumber: number;
    status: string;
    financialStatus: string;
    paymentStatus: string;
    totalPrice: string;
    customerInfo?: {
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
    liveTracking?: any; // The Delhivery tracking object
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
    const { user, loading: authLoading } = useAuth();
    const [orderNumber, setOrderNumber] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // State for Guest Tracking
    const [guestOrder, setGuestOrder] = useState<TrackingOrder | null>(null);

    // State for Logged-In Users
    const [userOrders, setUserOrders] = useState<TrackingOrder[] | null>(null);
    const [loadingUserOrders, setLoadingUserOrders] = useState(false);

    // Fetch user orders automatically when logged in
    useEffect(() => {
        if (!authLoading && user?.email) {
            const fetchUserOrders = async () => {
                setLoadingUserOrders(true);
                try {
                    const res = await fetch("/api/track/user", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: user.email }),
                    });
                    const data = await res.json();
                    if (data.success) {
                        setUserOrders(data.orders);
                    }
                } catch (err) {
                    console.error("Failed to fetch user orders:", err);
                } finally {
                    setLoadingUserOrders(false);
                }
            };
            fetchUserOrders();
        }
    }, [user, authLoading]);

    // Handle Manual Guest Lookup
    const handleGuestLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderNumber.trim() || !email.trim()) return;

        setLoading(true);
        setError("");
        setGuestOrder(null);

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
                setGuestOrder(data.order);
            } else {
                setError(data.error || "Order not found.");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // --- RENDER HELPERS ---

    const OrderCard = ({ order }: { order: TrackingOrder }) => {
        const activeStep = getActiveStep(order.status);
        
        return (
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="font-lora text-2xl font-medium text-slate-900">
                                Order #{order.orderNumber}
                            </h2>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                order.status?.toLowerCase() === 'delivered' 
                                    ? 'bg-[#0E4D55]/10 text-[#0E4D55]' 
                                    : 'bg-amber-100 text-amber-800'
                            }`}>
                                {order.status || 'Processing'}
                            </span>
                        </div>
                        <p className="text-sm font-medium text-slate-400">
                            Placed on{" "}
                            {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric", month: "short", year: "numeric",
                            })}
                        </p>
                    </div>
                    <div className="text-left sm:text-right">
                        <p className="font-lora text-xl font-medium text-slate-900">
                            ₹{parseFloat(order.totalPrice || "0").toLocaleString("en-IN")}
                        </p>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">
                            {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}
                        </p>
                    </div>
                </div>

                {/* Visual Timeline */}
                <div className="relative pt-4 pb-8">
                    <div className="flex items-center justify-between relative z-10 w-full max-w-lg mx-auto">
                        {timelineSteps.map((step, idx) => {
                            const StepIcon = step.icon;
                            const isComplete = idx <= activeStep;
                            const isCurrent = idx === activeStep;
                            return (
                                <div key={step.key} className="flex flex-col items-center flex-1 relative group">
                                    <div
                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-700 ${
                                            isComplete
                                                ? isCurrent
                                                    ? "bg-[#0E4D55] text-white shadow-xl shadow-[#0E4D55]/30 transform scale-110"
                                                    : "bg-[#0E4D55] text-white"
                                                : "bg-[#FDFBF7] border-2 border-gray-100 text-gray-300"
                                        }`}
                                    >
                                        <StepIcon size={20} className={isCurrent ? "animate-pulse" : ""} />
                                    </div>
                                    <span className={`absolute -bottom-8 w-max text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 ${
                                        isComplete ? "text-[#0E4D55]" : "text-gray-300"
                                    }`}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gray-100 -z-0 max-w-lg mx-auto">
                        <div
                            className="h-full bg-[#0E4D55] transition-all duration-1000 ease-out"
                            style={{ width: `${(activeStep / (timelineSteps.length - 1)) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Tracking & Address Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#FDFBF7] rounded-xl p-6 border border-[#0E4D55]/5">
                    {/* Delivery Address */}
                    {order.shippingAddress && (
                        <div>
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                <MapPin size={12} /> Delivery Destination
                            </h3>
                            <p className="text-sm font-medium text-slate-700 leading-relaxed">
                                <span className="text-slate-900 font-bold block mb-1">{order.shippingAddress.name}</span>
                                {order.shippingAddress.address1}<br />
                                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                            </p>
                        </div>
                    )}

                    {/* Shipping Info & Live Tracking */}
                    {(order.courier || order.awbNumber) && (
                        <div>
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#0E4D55] mb-4 flex items-center gap-2">
                                <Truck size={12} /> Live Scan Data
                            </h3>
                            <div className="space-y-3 text-sm text-slate-700">
                                {order.awbNumber && (
                                    <div className="flex justify-between items-center border-b border-[#0E4D55]/10 pb-2">
                                        <span className="text-slate-500 font-medium">AWB Number</span>
                                        <span className="font-mono font-medium text-slate-900">{order.awbNumber}</span>
                                    </div>
                                )}
                                {order.liveTracking?.data?.data?.[0]?.status?.statusLocation ? (
                                    <div className="flex justify-between items-center border-b border-[#0E4D55]/10 pb-2">
                                        <span className="text-slate-500 font-medium">Last Location</span>
                                        <span className="font-medium text-slate-900 text-right">
                                            {order.liveTracking.data.data[0].status.statusLocation}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center border-b border-[#0E4D55]/10 pb-2">
                                        <span className="text-slate-500 font-medium">Courier</span>
                                        <span className="font-medium text-slate-900">{order.courier}</span>
                                    </div>
                                )}
                                {order.trackingUrl && (
                                    <a
                                        href={order.trackingUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center w-full gap-2 mt-2 px-4 py-2.5 rounded-lg bg-white border border-[#0E4D55] text-[#0E4D55] text-xs font-bold uppercase tracking-wider hover:bg-[#0E4D55] hover:text-white transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-sm"
                                    >
                                        Track on Delhivery <ExternalLink size={12} />
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Items */}
                <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 px-2">
                        Items in this Shipment
                    </h3>
                    <div className="space-y-3">
                        {order.items?.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-[#FDFBF7] rounded-lg flex items-center justify-center text-[#0E4D55] font-bold">
                                        ×{item.quantity}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{item.title}</p>
                                        {item.variantTitle && (
                                            <p className="text-xs font-medium text-slate-500 mt-0.5">{item.variantTitle}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-lora font-medium text-slate-900">
                                        ₹{parseFloat(item.price || "0").toLocaleString("en-IN")}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <main className="min-h-screen bg-[#FDFBF7] flex flex-col font-figtree">
            <Navbar />

            <div className="flex-grow">
                {/* Hero Header */}
                <div className="bg-[#0E4D55] text-white py-24 md:py-32 relative overflow-hidden">
                    {/* Subtle aesthetic background elements */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#125A63] rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#0A3A40] rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/3 pointer-events-none" />
                    
                    <div className="container mx-auto px-4 relative z-10">
                        <div className="max-w-3xl mx-auto text-center">
                            <p className="text-xs uppercase tracking-[0.4em] font-bold text-[#D4AF37] mb-6">
                                Order Intelligence
                            </p>
                            <h1 className="text-4xl sm:text-5xl md:text-6xl font-lora font-medium tracking-tight mb-6">
                                {user ? "Your Orders" : "Track Your Order"}
                            </h1>
                            <p className="text-white/60 text-sm sm:text-base font-medium max-w-lg mx-auto leading-relaxed">
                                {user 
                                    ? "Monitor your active shipments and view your complete purchase history with real-time Delhivery tracking."
                                    : "Enter your order number and email below to view real-time tracking data and shipment status."}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 sm:px-6 -mt-12 relative z-20 pb-24">
                    {/* Auth Loading State */}
                    {authLoading ? (
                        <div className="flex justify-center pt-24">
                            <div className="animate-spin h-8 w-8 border-2 border-[#0E4D55]/30 border-t-[#0E4D55] rounded-full" />
                        </div>
                    ) : user ? (
                        /* ================= LOGGED IN USER VIEW ================= */
                        <div className="max-w-4xl mx-auto">
                            {loadingUserOrders ? (
                                <div className="flex flex-col items-center justify-center pt-24 space-y-4">
                                    <div className="animate-spin h-6 w-6 border-2 border-[#0E4D55]/30 border-t-[#0E4D55] rounded-full" />
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Syncing with Delhivery...</p>
                                </div>
                            ) : userOrders && userOrders.length > 0 ? (
                                <div className="space-y-12">
                                    {userOrders.map((order) => (
                                        <OrderCard key={order.id} order={order} />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                                    <Package size={32} className="mx-auto text-slate-300 mb-4" />
                                    <h3 className="font-lora text-xl font-medium text-slate-900 mb-2">No active orders found.</h3>
                                    <p className="text-sm text-slate-500 mb-6">When you place an order, its tracking will appear here automatically.</p>
                                    <a href="/shop" className="inline-block px-6 py-3 bg-[#0E4D55] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#0A3A40] transition-colors rounded-lg">
                                        Browse the Collection
                                    </a>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* ================= GUEST LOOKUP FORM ================= */
                        <div className="max-w-xl mx-auto space-y-12">
                            <form
                                onSubmit={handleGuestLookup}
                                className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-black/[0.03] border border-white p-8 sm:p-10 space-y-6"
                            >
                                <div className="space-y-5">
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-[#0E4D55] mb-2 block">
                                            Order Number
                                        </label>
                                        <input
                                            type="text"
                                            value={orderNumber}
                                            onChange={(e) => setOrderNumber(e.target.value)}
                                            placeholder="e.g. 1004"
                                            className="w-full px-5 py-4 rounded-xl border border-gray-200 text-sm font-medium focus:border-[#0E4D55] focus:ring-1 focus:ring-[#0E4D55] outline-none transition-all placeholder:font-normal placeholder:text-gray-400 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-[#0E4D55] mb-2 block">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="your@email.com"
                                            className="w-full px-5 py-4 rounded-xl border border-gray-200 text-sm font-medium focus:border-[#0E4D55] focus:ring-1 focus:ring-[#0E4D55] outline-none transition-all placeholder:font-normal placeholder:text-gray-400 bg-white"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-3 px-8 py-5 rounded-xl bg-[#0E4D55] text-white text-sm font-bold tracking-widest uppercase hover:bg-[#0A3A40] hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 transition-all duration-300"
                                >
                                    {loading ? (
                                        <span className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
                                    ) : (
                                        <>
                                            Track Order <ArrowRight size={16} />
                                        </>
                                    )}
                                </button>
                                {error && (
                                    <div className="flex items-center gap-2 text-rose-600 text-xs font-bold uppercase tracking-wider bg-rose-50 border border-rose-200 rounded-xl px-5 py-4">
                                        <AlertCircle size={14} />
                                        {error}
                                    </div>
                                )}
                            </form>

                            {/* Guest Order Result */}
                            {guestOrder && (
                                <OrderCard order={guestOrder} />
                            )}
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </main>
    );
}
