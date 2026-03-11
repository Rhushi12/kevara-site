"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
    Package,
    ChevronDown,
    ChevronUp,
    RotateCcw,
    X,
    ExternalLink,
    LogOut,
    User,
    MapPin,
    Clock,
    ShoppingBag,
    CheckCircle,
    Truck,
    AlertCircle,
} from "lucide-react";

interface TrackingInfo {
    number: string | null;
    url: string | null;
    company: string | null;
}

interface OrderItem {
    title: string;
    quantity: number;
    variantTitle?: string;
    image?: string;
    price?: string;
}

interface Order {
    id: string;
    orderNumber: string;
    createdAt: string;
    financialStatus: string;
    fulfillmentStatus: string;
    total: string;
    currency: string;
    items: OrderItem[];
    tracking?: TrackingInfo[];
    shippingCity?: string;
    shippingCountry?: string;
}

export default function AccountPage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');

    // Return request state
    const [returnModal, setReturnModal] = useState<Order | null>(null);
    const [returnType, setReturnType] = useState<'return' | 'exchange'>('return');
    const [returnReason, setReturnReason] = useState('');
    const [submittingReturn, setSubmittingReturn] = useState(false);
    const [returnSuccess, setReturnSuccess] = useState('');

    useEffect(() => {
        if (!user) {
            router.push("/login");
        }
    }, [user, router]);

    useEffect(() => {
        if (user?.email) {
            fetch(`/api/orders?email=${encodeURIComponent(user.email)}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) setOrders(data.orders || []);
                })
                .catch(err => console.error("Failed to fetch orders:", err))
                .finally(() => setLoadingOrders(false));
        } else {
            setLoadingOrders(false);
        }
    }, [user]);

    const submitReturnRequest = async () => {
        if (!returnModal || !returnReason.trim()) return;
        setSubmittingReturn(true);
        try {
            const res = await fetch('/api/returns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderNumber: returnModal.orderNumber,
                    orderId: returnModal.id,
                    customerEmail: user?.email,
                    customerName: user?.displayName,
                    reason: returnReason,
                    items: returnModal.items.map(i => i.title),
                    type: returnType
                })
            });
            const data = await res.json();
            if (data.success) {
                setReturnSuccess(data.message);
                setTimeout(() => {
                    setReturnModal(null);
                    setReturnSuccess('');
                    setReturnReason('');
                }, 3000);
            }
        } catch (e: any) {
            console.error("Return request failed:", e);
        } finally {
            setSubmittingReturn(false);
        }
    };

    if (!user) return null;

    const statusConfig = (status: string) => {
        const s = status?.toUpperCase();
        if (s === "PAID") return { color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: CheckCircle, label: "Paid" };
        if (s === "FULFILLED") return { color: "text-blue-700 bg-blue-50 border-blue-200", icon: Truck, label: "Shipped" };
        if (s === "PENDING" || s === "UNFULFILLED") return { color: "text-amber-700 bg-amber-50 border-amber-200", icon: Clock, label: s === "PENDING" ? "Pending" : "Processing" };
        if (s === "REFUNDED" || s === "PARTIALLY_REFUNDED") return { color: "text-rose-700 bg-rose-50 border-rose-200", icon: AlertCircle, label: s === "PARTIALLY_REFUNDED" ? "Partial Refund" : "Refunded" };
        return { color: "text-gray-700 bg-gray-50 border-gray-200", icon: Package, label: status || "Unknown" };
    };

    const initials = user.displayName
        ? user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : user.email?.charAt(0).toUpperCase() || 'U';

    const memberSince = user.metadata?.creationTime
        ? new Date(user.metadata.creationTime).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
        : 'Recently joined';

    return (
        <main className="min-h-screen bg-[#FDFBF7] flex flex-col font-figtree">
            <Navbar />

            <div className="flex-grow">
                {/* Hero Profile Header */}
                <div className="bg-gradient-to-br from-[#0E4D55] via-[#0A3A40] to-[#072C32] text-white">
                    <div className="container mx-auto px-4 sm:px-6 pt-24 md:pt-32 pb-20 md:pb-24">
                        <div className="max-w-4xl mx-auto">
                            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 sm:gap-6">
                                {/* Avatar */}
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-3xl sm:text-4xl font-lora text-white shadow-lg shrink-0">
                                    {initials}
                                </div>
                                <div className="text-center sm:text-left flex-1">
                                    <h1 className="text-2xl sm:text-3xl font-lora font-light tracking-tight">
                                        {user.displayName || "Welcome"}
                                    </h1>
                                    <p className="text-white/60 text-sm mt-1">{user.email}</p>
                                    <p className="text-white/40 text-xs mt-1.5 flex items-center justify-center sm:justify-start gap-1.5">
                                        <Clock size={11} /> Member since {memberSince}
                                    </p>
                                </div>
                                <button
                                    onClick={() => logout()}
                                    className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 transition-all"
                                >
                                    <LogOut size={14} />
                                    Sign Out
                                </button>
                            </div>

                            {/* Quick Stats */}
                            <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-lora font-medium">{orders.length}</p>
                                    <p className="text-white/50 text-xs font-medium mt-0.5">Orders</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-lora font-medium">
                                        {orders.filter(o => o.fulfillmentStatus?.toUpperCase() === 'FULFILLED').length}
                                    </p>
                                    <p className="text-white/50 text-xs font-medium mt-0.5">Delivered</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-lora font-medium">
                                        ₹{orders.reduce((a, o) => a + parseFloat(o.total || '0'), 0).toLocaleString('en-IN')}
                                    </p>
                                    <p className="text-white/50 text-xs font-medium mt-0.5">Total Spent</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-gray-200 bg-white sticky top-0 z-20">
                    <div className="container mx-auto px-4 sm:px-6">
                        <div className="max-w-4xl mx-auto flex items-center gap-1">
                            <button
                                onClick={() => setActiveTab('orders')}
                                className={`px-5 py-4 text-sm font-semibold border-b-2 transition-colors ${
                                    activeTab === 'orders'
                                        ? 'border-[#0E4D55] text-[#0E4D55]'
                                        : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                <ShoppingBag size={14} className="inline mr-2 -mt-0.5" />
                                Orders
                            </button>
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`px-5 py-4 text-sm font-semibold border-b-2 transition-colors ${
                                    activeTab === 'profile'
                                        ? 'border-[#0E4D55] text-[#0E4D55]'
                                        : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                <User size={14} className="inline mr-2 -mt-0.5" />
                                Account
                            </button>

                            {/* Mobile logout */}
                            <button
                                onClick={() => logout()}
                                className="sm:hidden ml-auto px-3 py-2 text-sm text-red-500 font-medium"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="container mx-auto px-4 sm:px-6 py-8 md:py-12">
                    <div className="max-w-4xl mx-auto">

                        {/* Orders Tab */}
                        {activeTab === 'orders' && (
                            <div className="space-y-4">
                                {loadingOrders ? (
                                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                                        <div className="inline-block w-8 h-8 border-2 border-[#0E4D55] border-t-transparent rounded-full animate-spin" />
                                        <p className="text-sm text-gray-500 mt-4">Loading your orders...</p>
                                    </div>
                                ) : orders.length === 0 ? (
                                    <div className="bg-white rounded-2xl border border-gray-100 p-12 md:p-16 text-center">
                                        <div className="w-16 h-16 rounded-2xl bg-gray-50 mx-auto flex items-center justify-center mb-4">
                                            <Package size={24} className="text-gray-300" />
                                        </div>
                                        <h3 className="text-lg font-lora font-medium text-slate-900 mb-1">No orders yet</h3>
                                        <p className="text-gray-400 text-sm max-w-xs mx-auto">
                                            Your order history will appear here after your first purchase.
                                        </p>
                                        <button
                                            onClick={() => router.push('/shop')}
                                            className="mt-6 px-6 py-3 bg-[#0E4D55] text-white text-sm font-semibold rounded-xl hover:bg-[#0A3A40] transition-colors"
                                        >
                                            Start Shopping
                                        </button>
                                    </div>
                                ) : (
                                    orders.map((order) => {
                                        const paymentStatus = statusConfig(order.financialStatus);
                                        const fulfillStatus = statusConfig(order.fulfillmentStatus);
                                        const PayIcon = paymentStatus.icon;
                                        const FulIcon = fulfillStatus.icon;
                                        const isExpanded = expandedOrder === order.id;

                                        return (
                                            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                                {/* Order Header */}
                                                <button
                                                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                                                    className="w-full p-5 sm:p-6 text-left"
                                                >
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                                        {/* Order info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <span className="font-mono text-sm font-bold text-slate-900">{order.orderNumber}</span>
                                                                <span className="text-xs text-gray-400">
                                                                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                                        day: 'numeric', month: 'short', year: 'numeric'
                                                                    })}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${paymentStatus.color}`}>
                                                                    <PayIcon size={11} /> {paymentStatus.label}
                                                                </span>
                                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${fulfillStatus.color}`}>
                                                                    <FulIcon size={11} /> {fulfillStatus.label}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Price + expand */}
                                                        <div className="flex items-center justify-between sm:justify-end gap-4">
                                                            <p className="text-xl font-lora font-medium text-slate-900">
                                                                ₹{parseFloat(order.total || '0').toLocaleString('en-IN')}
                                                            </p>
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'bg-[#0E4D55] text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>

                                                {/* Expanded Details */}
                                                {isExpanded && (
                                                    <div className="border-t border-gray-100 p-5 sm:p-6 space-y-3 bg-gray-50/30 animate-in fade-in slide-in-from-top-2 duration-200">
                                                        {order.items.map((item, idx) => (
                                                            <div key={idx} className="flex items-center gap-4 p-3 sm:p-4 bg-white rounded-xl border border-gray-100">
                                                                {item.image ? (
                                                                    <img src={item.image} alt={item.title} className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg" />
                                                                ) : (
                                                                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                                                        <Package size={18} className="text-gray-300" />
                                                                    </div>
                                                                )}
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-semibold text-slate-900 line-clamp-1">{item.title}</p>
                                                                    {item.variantTitle && item.variantTitle !== "Default Title" && (
                                                                        <p className="text-xs text-gray-500 mt-0.5">{item.variantTitle}</p>
                                                                    )}
                                                                    <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                                                                </div>
                                                                {item.price && (
                                                                    <p className="text-sm font-semibold text-slate-900">
                                                                        ₹{parseFloat(item.price).toLocaleString('en-IN')}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ))}

                                                        {order.shippingCity && (
                                                            <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
                                                                <MapPin size={12} />
                                                                Shipped to {order.shippingCity}, {order.shippingCountry}
                                                            </div>
                                                        )}

                                                        {/* Tracking */}
                                                        {order.tracking && order.tracking.length > 0 && (
                                                            <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl space-y-2">
                                                                {order.tracking.map((t, idx) => (
                                                                    <div key={idx} className="flex items-center justify-between gap-3">
                                                                        <div className="flex items-center gap-2">
                                                                            <Truck size={14} className="text-blue-600" />
                                                                            <p className="text-xs font-semibold text-blue-900">
                                                                                {t.company || "Carrier"} {t.number && `• ${t.number}`}
                                                                            </p>
                                                                        </div>
                                                                        {t.url && (
                                                                            <a
                                                                                href={t.url}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-700 hover:text-blue-900 transition-colors"
                                                                            >
                                                                                Track
                                                                                <ExternalLink size={11} />
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Return/Exchange */}
                                                        {order.fulfillmentStatus?.toUpperCase() === "FULFILLED" && (
                                                            <button
                                                                onClick={() => { setReturnModal(order); setReturnSuccess(''); setReturnReason(''); }}
                                                                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 border border-slate-200 px-4 py-2.5 rounded-xl hover:border-slate-300 transition-colors bg-white"
                                                            >
                                                                <RotateCcw size={13} />
                                                                Request Return / Exchange
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <div className="space-y-4">
                                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                                    <div className="p-6 border-b border-gray-100">
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Account Details</h3>
                                    </div>
                                    <div className="divide-y divide-gray-50">
                                        <div className="px-6 py-4 flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-gray-400 font-medium">Full Name</p>
                                                <p className="text-sm font-medium text-slate-900 mt-0.5">{user.displayName || "Not set"}</p>
                                            </div>
                                            <User size={16} className="text-gray-300" />
                                        </div>
                                        <div className="px-6 py-4 flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-gray-400 font-medium">Email Address</p>
                                                <p className="text-sm font-medium text-slate-900 mt-0.5">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="px-6 py-4 flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-gray-400 font-medium">Member Since</p>
                                                <p className="text-sm font-medium text-slate-900 mt-0.5">{memberSince}</p>
                                            </div>
                                            <Clock size={16} className="text-gray-300" />
                                        </div>
                                        <div className="px-6 py-4 flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-gray-400 font-medium">Authentication</p>
                                                <p className="text-sm font-medium text-slate-900 mt-0.5">
                                                    {user.providerData?.[0]?.providerId === 'google.com' ? 'Google' : 'Email & Password'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Danger Zone */}
                                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Actions</h3>
                                    <button
                                        onClick={() => logout()}
                                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-rose-600 border border-rose-200 hover:bg-rose-50 transition-colors"
                                    >
                                        <LogOut size={14} />
                                        Sign Out of Account
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Return Request Modal */}
            {returnModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md p-6 relative animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
                        <button onClick={() => setReturnModal(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-slate-500 transition-colors">
                            <X size={16} />
                        </button>

                        <h3 className="text-lg font-lora font-medium text-slate-900 mb-1">Return or Exchange</h3>
                        <p className="text-xs text-slate-500 mb-6">Order {returnModal.orderNumber}</p>

                        {returnSuccess ? (
                            <div className="text-center py-8">
                                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                                    <CheckCircle size={24} className="text-emerald-600" />
                                </div>
                                <p className="text-sm font-semibold text-emerald-700">{returnSuccess}</p>
                            </div>
                        ) : (
                            <>
                                {/* Type Selector */}
                                <div className="flex gap-3 mb-5">
                                    <button
                                        onClick={() => setReturnType('return')}
                                        className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${returnType === 'return' ? 'bg-[#0E4D55] text-white border-[#0E4D55] shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                                    >
                                        Return
                                    </button>
                                    <button
                                        onClick={() => setReturnType('exchange')}
                                        className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${returnType === 'exchange' ? 'bg-[#0E4D55] text-white border-[#0E4D55] shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                                    >
                                        Exchange
                                    </button>
                                </div>

                                {/* Reason */}
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-900 mb-2">Reason</label>
                                <select
                                    value={returnReason}
                                    onChange={(e) => setReturnReason(e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-[#0E4D55]/20 focus:border-[#0E4D55] appearance-none bg-white"
                                >
                                    <option value="">Select a reason...</option>
                                    <option value="Wrong size">Wrong size</option>
                                    <option value="Defective product">Defective / damaged product</option>
                                    <option value="Wrong item received">Wrong item received</option>
                                    <option value="Quality not as expected">Quality not as expected</option>
                                    <option value="Changed my mind">Changed my mind</option>
                                    <option value="Other">Other</option>
                                </select>

                                <button
                                    onClick={submitReturnRequest}
                                    disabled={submittingReturn || !returnReason}
                                    className="w-full py-3.5 bg-[#0E4D55] text-white text-sm font-bold uppercase tracking-widest rounded-xl hover:bg-[#0A3A40] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submittingReturn ? "Submitting..." : "Submit Request"}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            <Footer />
        </main>
    );
}
