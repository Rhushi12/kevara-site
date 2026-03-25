"use client";

import { useEffect, useState } from "react";
import {
    Package,
    ChevronDown,
    ChevronUp,
    Truck,
    CheckCircle,
    Clock,
    AlertCircle,
    Search,
    RefreshCw,
    ExternalLink,
    MapPin,
    User as UserIcon,
    Mail,
    Phone,
    X,
    Save,
} from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";

interface OrderItem {
    id: string;
    title: string;
    variantTitle?: string;
    quantity: number;
    price: string;
    sku?: string;
}

interface FirebaseOrder {
    id: string;
    shopifyOrderId: string;
    orderNumber: number;
    status: string;
    financialStatus: string;
    paymentStatus: string;
    totalPrice: string;
    customerInfo: {
        email: string;
        phone: string;
        firstName: string;
        lastName: string;
    };
    shippingAddress: {
        name: string;
        address1: string;
        address2: string;
        city: string;
        state: string;
        zip: string;
        country: string;
        phone: string;
    } | null;
    items: OrderItem[];
    courier: string | null;
    awbNumber: string | null;
    expectedDeliveryDate: string | null;
    trackingUrl: string | null;
    createdAt: string;
    updatedAt: string;
}

const statusConfig: Record<string, { color: string; bg: string; border: string; icon: any; label: string }> = {
    unfulfilled: { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", icon: Clock, label: "Unfulfilled" },
    shipped: { color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", icon: Truck, label: "Shipped" },
    delivered: { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle, label: "Delivered" },
    cancelled: { color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200", icon: AlertCircle, label: "Cancelled" },
};

const getStatusStyle = (status: string) => {
    return statusConfig[status?.toLowerCase()] || statusConfig.unfulfilled;
};

export default function OrdersTable() {
    const [orders, setOrders] = useState<FirebaseOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

    // Edit state
    const [editingOrder, setEditingOrder] = useState<string | null>(null);
    const [editStatus, setEditStatus] = useState("");
    const [editCourier, setEditCourier] = useState("");
    const [editAwb, setEditAwb] = useState("");
    const [editTrackingUrl, setEditTrackingUrl] = useState("");
    const [saving, setSaving] = useState(false);

    // Delhivery fulfillment state
    const [fulfilling, setFulfilling] = useState<string | null>(null);
    const [fulfillError, setFulfillError] = useState("");
    const [fulfillSuccess, setFulfillSuccess] = useState("");

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await adminFetch("/api/admin/orders");
            const data = await res.json();
            if (data.success) setOrders(data.orders || []);
        } catch (err) {
            console.error("Failed to fetch orders:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrders(); }, []);

    const saveOrderUpdate = async (orderId: string) => {
        setSaving(true);
        try {
            const res = await adminFetch("/api/admin/orders", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId,
                    status: editStatus || undefined,
                    courier: editCourier || undefined,
                    awbNumber: editAwb || undefined,
                    trackingUrl: editTrackingUrl || undefined,
                }),
            });
            const data = await res.json();
            if (data.success) {
                await fetchOrders();
                setEditingOrder(null);
            }
        } catch (err) {
            console.error("Failed to update order:", err);
        } finally {
            setSaving(false);
        }
    };

    const startEditing = (order: FirebaseOrder) => {
        setEditingOrder(order.id);
        setEditStatus(order.status || "unfulfilled");
        setEditCourier(order.courier || "");
        setEditAwb(order.awbNumber || "");
        setEditTrackingUrl(order.trackingUrl || "");
    };

    const fulfillWithDelhivery = async (orderId: string) => {
        if (!confirm("Create a Delhivery shipment for this order? An AWB will be generated and the order marked as Shipped.")) return;
        setFulfilling(orderId);
        setFulfillError("");
        setFulfillSuccess("");
        try {
            const res = await adminFetch("/api/admin/fulfill", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, weight: 500 }),
            });
            const data = await res.json();
            if (data.success) {
                setFulfillSuccess(`✅ AWB ${data.waybill} generated! Order marked as Shipped.`);
                await fetchOrders();
            } else {
                setFulfillError(data.error || "Failed to create shipment");
            }
        } catch (err: any) {
            setFulfillError(err.message || "Network error");
        } finally {
            setFulfilling(null);
        }
    };

    // Filter logic
    const filtered = orders.filter(o => {
        const matchesSearch =
            searchTerm === "" ||
            o.orderNumber?.toString().includes(searchTerm) ||
            o.customerInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.customerInfo?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.customerInfo?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
            statusFilter === "all" || o.status?.toLowerCase() === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Stats
    const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.totalPrice || "0"), 0);
    const unfulfilledCount = orders.filter(o => !o.status || o.status === "unfulfilled").length;
    const shippedCount = orders.filter(o => o.status === "shipped").length;
    const deliveredCount = orders.filter(o => o.status === "delivered").length;

    return (
        <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200/60 p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Orders</p>
                    <p className="text-2xl font-lora font-medium text-slate-900 mt-1">{orders.length}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200/60 p-4 shadow-sm">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Revenue</p>
                    <p className="text-2xl font-lora font-medium text-slate-900 mt-1">₹{totalRevenue.toLocaleString("en-IN")}</p>
                </div>
                <div className="bg-white rounded-xl border border-amber-200/60 p-4 shadow-sm">
                    <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Unfulfilled</p>
                    <p className="text-2xl font-lora font-medium text-amber-700 mt-1">{unfulfilledCount}</p>
                </div>
                <div className="bg-white rounded-xl border border-emerald-200/60 p-4 shadow-sm">
                    <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Delivered</p>
                    <p className="text-2xl font-lora font-medium text-emerald-700 mt-1">{deliveredCount}</p>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by Order #, name, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:border-[#0E4D55] focus:ring-1 focus:ring-[#0E4D55]/20 outline-none transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    {["all", "unfulfilled", "shipped", "delivered"].map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all capitalize ${
                                statusFilter === s
                                    ? "bg-[#0E4D55] text-white border-[#0E4D55]"
                                    : "bg-white text-slate-600 border-gray-200 hover:border-[#0E4D55]/30"
                            }`}
                        >
                            {s === "all" ? "All" : s}
                        </button>
                    ))}
                    <button
                        onClick={fetchOrders}
                        className="p-2.5 rounded-xl border border-gray-200 bg-white text-slate-500 hover:text-[#0E4D55] hover:border-[#0E4D55]/30 transition-all"
                        title="Refresh"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* Orders List */}
            {loading ? (
                <div className="bg-white rounded-xl border border-gray-200/60 p-12 text-center shadow-sm">
                    <RefreshCw size={24} className="animate-spin text-[#0E4D55] mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">Loading orders...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200/60 p-12 text-center shadow-sm">
                    <Package size={32} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">
                        {orders.length === 0
                            ? "No orders yet. Orders will appear here after customers check out."
                            : "No orders match your filters."}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((order) => {
                        const style = getStatusStyle(order.status);
                        const StatusIcon = style.icon;
                        const isExpanded = expandedOrder === order.id;
                        const isEditing = editingOrder === order.id;

                        return (
                            <div
                                key={order.id}
                                className="bg-white rounded-xl border border-gray-200/60 shadow-sm overflow-hidden transition-all hover:shadow-md"
                            >
                                {/* Order Row */}
                                <div
                                    className="flex items-center gap-4 p-4 cursor-pointer"
                                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-lora font-medium text-slate-900">
                                                #{order.orderNumber}
                                            </span>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${style.bg} ${style.color} ${style.border}`}>
                                                <StatusIcon size={10} />
                                                {style.label}
                                            </span>
                                            {order.paymentStatus && (
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                                    order.paymentStatus === "Paid"
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                        : "bg-amber-50 text-amber-700 border-amber-200"
                                                }`}>
                                                    {order.paymentStatus}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            {order.customerInfo?.firstName} {order.customerInfo?.lastName}
                                            {order.customerInfo?.email && ` · ${order.customerInfo.email}`}
                                        </p>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <p className="font-lora font-medium text-slate-900">
                                            ₹{parseFloat(order.totalPrice || "0").toLocaleString("en-IN")}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                            {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                                day: "numeric", month: "short", year: "numeric"
                                            })}
                                        </p>
                                    </div>

                                    <div className="shrink-0 text-slate-400">
                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </div>
                                </div>

                                {/* Expanded Detail */}
                                {isExpanded && (
                                    <div className="border-t border-gray-100 bg-[#FDFBF7] p-5 space-y-5 animate-in fade-in slide-in-from-top-1 duration-200">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                            {/* Customer Info */}
                                            <div className="space-y-2">
                                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Customer</h4>
                                                <div className="space-y-1.5 text-sm text-slate-700">
                                                    <p className="flex items-center gap-2">
                                                        <UserIcon size={13} className="text-slate-400" />
                                                        {order.customerInfo?.firstName} {order.customerInfo?.lastName}
                                                    </p>
                                                    {order.customerInfo?.email && (
                                                        <p className="flex items-center gap-2">
                                                            <Mail size={13} className="text-slate-400" />
                                                            {order.customerInfo.email}
                                                        </p>
                                                    )}
                                                    {order.customerInfo?.phone && (
                                                        <p className="flex items-center gap-2">
                                                            <Phone size={13} className="text-slate-400" />
                                                            {order.customerInfo.phone}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Shipping Address */}
                                            <div className="space-y-2">
                                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Shipping Address</h4>
                                                {order.shippingAddress ? (
                                                    <div className="text-sm text-slate-700 space-y-0.5">
                                                        <p className="flex items-start gap-2">
                                                            <MapPin size={13} className="text-slate-400 mt-0.5 shrink-0" />
                                                            <span>
                                                                {order.shippingAddress.name}<br />
                                                                {order.shippingAddress.address1}
                                                                {order.shippingAddress.address2 && <>, {order.shippingAddress.address2}</>}<br />
                                                                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}<br />
                                                                {order.shippingAddress.country}
                                                            </span>
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-slate-400 italic">No shipping address</p>
                                                )}
                                            </div>

                                            {/* Tracking / Fulfillment */}
                                            <div className="space-y-2">
                                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tracking</h4>
                                                {order.courier || order.awbNumber ? (
                                                    <div className="text-sm text-slate-700 space-y-1">
                                                        {order.courier && <p><span className="text-slate-400">Courier:</span> {order.courier}</p>}
                                                        {order.awbNumber && <p><span className="text-slate-400">AWB:</span> {order.awbNumber}</p>}
                                                        {order.trackingUrl && (
                                                            <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 text-[#0E4D55] hover:underline text-xs font-medium mt-1">
                                                                Track Package <ExternalLink size={11} />
                                                            </a>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-slate-400 italic">Not yet shipped</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Line Items */}
                                        <div>
                                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Items</h4>
                                            <div className="bg-white rounded-lg border border-gray-200/60 divide-y divide-gray-100">
                                                {order.items?.map((item, idx) => (
                                                    <div key={idx} className="flex items-center justify-between px-4 py-3 text-sm">
                                                        <div>
                                                            <p className="font-medium text-slate-800">{item.title}</p>
                                                            {item.variantTitle && (
                                                                <p className="text-xs text-slate-400 mt-0.5">{item.variantTitle}</p>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-slate-700">×{item.quantity}</p>
                                                            <p className="text-xs text-slate-400">₹{parseFloat(item.price || "0").toLocaleString("en-IN")}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Fulfill with Delhivery */}
                                        {(!order.awbNumber && (!order.status || order.status === "unfulfilled")) && (
                                            <div className="space-y-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); fulfillWithDelhivery(order.id); }}
                                                    disabled={fulfilling === order.id}
                                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors uppercase tracking-wider"
                                                >
                                                    <Truck size={13} />
                                                    {fulfilling === order.id ? "Creating Shipment..." : "Fulfill with Delhivery"}
                                                </button>
                                                {fulfillError && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{fulfillError}</p>}
                                                {fulfillSuccess && <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{fulfillSuccess}</p>}
                                            </div>
                                        )}

                                        {/* Edit Controls */}
                                        {!isEditing ? (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); startEditing(order); }}
                                                className="px-4 py-2 rounded-lg text-xs font-medium bg-[#0E4D55] text-white hover:bg-[#0A3A40] transition-colors"
                                            >
                                                Update Status / Tracking
                                            </button>
                                        ) : (
                                            <div className="bg-white rounded-lg border border-[#0E4D55]/20 p-4 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#0E4D55]">Edit Order</h4>
                                                    <button onClick={() => setEditingOrder(null)} className="text-slate-400 hover:text-slate-600">
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Status</label>
                                                        <select
                                                            value={editStatus}
                                                            onChange={(e) => setEditStatus(e.target.value)}
                                                            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#0E4D55] outline-none"
                                                        >
                                                            <option value="unfulfilled">Unfulfilled</option>
                                                            <option value="shipped">Shipped</option>
                                                            <option value="delivered">Delivered</option>
                                                            <option value="cancelled">Cancelled</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Courier</label>
                                                        <input
                                                            value={editCourier}
                                                            onChange={(e) => setEditCourier(e.target.value)}
                                                            placeholder="e.g. Delhivery"
                                                            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#0E4D55] outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">AWB / Tracking #</label>
                                                        <input
                                                            value={editAwb}
                                                            onChange={(e) => setEditAwb(e.target.value)}
                                                            placeholder="e.g. 1234567890"
                                                            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#0E4D55] outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Tracking URL</label>
                                                        <input
                                                            value={editTrackingUrl}
                                                            onChange={(e) => setEditTrackingUrl(e.target.value)}
                                                            placeholder="https://..."
                                                            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#0E4D55] outline-none"
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => saveOrderUpdate(order.id)}
                                                    disabled={saving}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-[#0E4D55] text-white hover:bg-[#0A3A40] disabled:opacity-50 transition-colors"
                                                >
                                                    <Save size={12} />
                                                    {saving ? "Saving..." : "Save Changes"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
