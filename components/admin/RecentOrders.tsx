"use client";

import { useEffect, useState } from "react";
import { Copy, MapPin, Receipt, AlertTriangle } from "lucide-react";

interface Order {
    id: string;
    name: string;
    createdAt: string;
    displayFinancialStatus: string;
    displayFulfillmentStatus: string;
    totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
    customer: { firstName: string | null; lastName: string | null; email: string | null } | null;
}

export default function RecentOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [needsScope, setNeedsScope] = useState(false);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await fetch('/api/admin/orders/recent');
                if (response.ok) {
                    const data = await response.json();
                    if (data.needsScope) {
                        setNeedsScope(true);
                    }
                    if (data.orders) {
                        setOrders(data.orders);
                    }
                }
            } catch (error) {
                console.error("RecentOrders fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'paid': return 'bg-emerald-100 text-emerald-800';
            case 'pending': return 'bg-amber-100 text-amber-800';
            case 'refunded': return 'bg-rose-100 text-rose-800';
            case 'fulfilled': return 'bg-blue-100 text-blue-800';
            case 'unfulfilled': return 'bg-slate-100 text-slate-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200/60 h-[400px] flex items-center justify-center animate-pulse">
            <span className="text-sm font-medium text-slate-400 tracking-widest uppercase">Loading Orders...</span>
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200/60 transition-shadow hover:shadow-md h-full flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-lora font-medium text-slate-900 tracking-tight">Recent Orders</h3>
                    <p className="text-xs text-slate-500 font-medium">Latest store transactions</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                    <Receipt size={16} className="text-blue-600" />
                </div>
            </div>

            {needsScope && (
                <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-white border border-rose-100 rounded-lg shadow-lg p-5 max-w-sm text-center">
                        <AlertTriangle className="mx-auto text-rose-500 mb-3" size={24} />
                        <h4 className="text-slate-900 font-bold mb-1">Access Denied</h4>
                        <p className="text-slate-500 text-sm">Enable the <code>read_orders</code> scope in your Shopify App configuration to view live transactions.</p>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-auto pr-2 -mr-2 space-y-3">
                {orders.length === 0 && !needsScope ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <Receipt size={24} className="mb-2 opacity-50" />
                        <span className="text-xs font-medium">No recent orders</span>
                    </div>
                ) : (
                    orders.map((order) => {
                        const date = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                        const name = order.customer ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() : 'Guest Customer';
                        const amount = parseFloat(order.totalPriceSet?.shopMoney?.amount || "0");

                        return (
                            <div key={order.id} className="p-4 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors bg-white group cursor-pointer shadow-sm hover:shadow">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-sm font-semibold text-slate-900">{order.name}</span>
                                        <button className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600">
                                            <Copy size={12} />
                                        </button>
                                    </div>
                                    <span className="text-sm font-bold text-slate-900">${amount.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-slate-700">{name}</span>
                                        <span className="text-xs text-slate-500">{date}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold ${getStatusColor(order.displayFinancialStatus)}`}>
                                            {order.displayFinancialStatus}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold ${getStatusColor(order.displayFulfillmentStatus)}`}>
                                            {order.displayFulfillmentStatus}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <button className="w-full mt-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-widest hover:text-slate-900 transition-colors border-t border-slate-100">
                View All Orders
            </button>
        </div>
    );
}
