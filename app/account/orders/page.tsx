"use client";
import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function OrdersPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        if (user?.email) {
            fetch(`/api/orders?email=${encodeURIComponent(user.email)}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setOrders(data.orders || []);
                    }
                })
                .catch(err => console.error("Failed to fetch orders:", err))
                .finally(() => setIsLoading(false));
        }
    }, [user, router]);

    const getStatusStyle = (status: string) => {
        const s = status?.toLowerCase() || '';
        if (s.includes('delivered') || s.includes('fulfilled')) return 'border-[#006D77] text-[#006D77]';
        if (s.includes('shipped') || s.includes('transit')) return 'border-slate-800 text-slate-800';
        if (s.includes('cancelled') || s.includes('refunded')) return 'border-rose-300 text-rose-600';
        return 'border-slate-300 text-slate-500'; // Processing/Unfulfilled
    };

    return (
        <main className="min-h-screen bg-[#FDFBF7] text-slate-900 font-figtree flex flex-col selection:bg-[#006D77]/20">
            <Navbar />
            <div className="container mx-auto px-4 sm:px-6 pt-32 md:pt-40 pb-24 max-w-4xl flex-1">
                <button 
                    onClick={() => router.push('/account')}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#006D77] hover:text-[#004e55] transition-colors mb-12"
                >
                    <ArrowLeft size={14} /> Back to Dashboard
                </button>
                
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-black/5 pb-8">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-prata tracking-tight mb-3 text-slate-900">Purchase History</h1>
                        <p className="font-lora italic text-slate-500 text-lg">An elite ledger of your past orders and ongoing shipments.</p>
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-white border border-slate-200 px-4 py-2 rounded-sm shadow-sm">
                        {orders.length} Entries Built
                    </div>
                </div>

                <div className="space-y-6">
                    {isLoading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="bg-white border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-8 rounded-sm overflow-hidden relative animate-pulse">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="h-6 w-32 bg-slate-200"></div>
                                    <div className="h-6 w-24 bg-[#FDFBF7]"></div>
                                </div>
                                <div className="h-20 w-full bg-[#FDFBF7]"></div>
                            </div>
                        ))
                    ) : orders.length === 0 ? (
                        <div className="bg-white border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-16 text-center rounded-sm">
                            <h3 className="text-2xl font-prata text-slate-900 mb-3">No Orders Logged</h3>
                            <p className="font-lora italic text-slate-500 max-w-md mx-auto mb-8">It appears your archive is currently empty. Discover our collections to curate your first look.</p>
                            <button onClick={() => router.push('/collections/all')} className="px-8 py-4 bg-[#006D77] text-[#FDFBF7] text-xs font-bold uppercase tracking-widest hover:bg-[#004e55] transition-colors">
                                Explore Collection
                            </button>
                        </div>
                    ) : (
                        orders.map((order, index) => (
                            <motion.div 
                                key={order.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                            >
                                <div className="bg-white border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden hover:border-slate-200 transition-colors duration-300 rounded-sm">
                                    <div 
                                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                                        className="p-6 md:p-8 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-[#FDFBF7]/50 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-4 mb-2">
                                                <h3 className="text-lg font-prata text-slate-900">Order {order.orderNumber}</h3>
                                                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border ${getStatusStyle(order.fulfillmentStatus || order.financialStatus)}`}>
                                                    {order.fulfillmentStatus || order.financialStatus || 'Processing'}
                                                </span>
                                            </div>
                                            <p className="text-xs font-lora italic text-slate-500 flex items-center gap-4">
                                                <span>{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                <span>{order.items?.length || 0} Piece(s)</span>
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between md:justify-end gap-8 w-full md:w-auto">
                                            <div className="text-left md:text-right">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total Expanse</p>
                                                <p className="font-prata text-lg text-slate-900">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: order.currency || 'INR' }).format(order.total || 0)}</p>
                                            </div>
                                            <button className="text-slate-300 group-hover:text-[#006D77] transition-colors">
                                                {expandedOrder === order.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </button>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {expandedOrder === order.id && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="border-t border-slate-100 bg-[#FDFBF7]/50"
                                            >
                                                <div className="p-6 md:p-8 space-y-6">
                                                    {order.items?.map((item: any, i: number) => (
                                                        <div key={i} className="flex items-start gap-6 border-b border-black/5 pb-6 last:border-0 last:pb-0">
                                                            <div className="w-20 h-24 bg-white border border-slate-200 p-1 flex-shrink-0">
                                                                {item.image ? (
                                                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full bg-slate-50 flex items-center justify-center text-xs italic text-slate-300">No Image</div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0 pt-1">
                                                                <h4 className="font-prata text-base text-slate-900 mb-1 line-clamp-1">{item.title}</h4>
                                                                {item.variantTitle && item.variantTitle !== "Default Title" && (
                                                                    <p className="text-xs text-slate-500 font-lora italic mb-3">{item.variantTitle}</p>
                                                                )}
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#006D77]">Qty. {item.quantity}</span>
                                                                    <span className="text-sm font-semibold tracking-wide">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: order.currency || 'INR' }).format(item.price || 0)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {order.tracking?.[0]?.url && (
                                                        <div className="pt-6">
                                                            <a href={order.tracking[0].url} target="_blank" rel="noopener noreferrer" className="inline-flex w-full md:w-auto items-center justify-center px-8 py-3 bg-[#006D77] text-[#FDFBF7] text-xs font-bold uppercase tracking-widest hover:bg-[#004e55] transition-colors">
                                                                Track Active Shipment
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
            <Footer />
        </main>
    );
}
