"use client";

import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, ShoppingBag, Users, Eye, Package } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";

export default function DashboardStats() {
    const [stats, setStats] = useState({
        productCount: 0,
        userCount: 0,
        todayViews: 0,
        totalViews: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const statsRes = await adminFetch('/api/admin/stats');
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStats({
                        productCount: statsData.productCount || 0,
                        userCount: statsData.userCount || 0,
                        todayViews: statsData.todayViews || 0,
                        totalViews: statsData.totalViews || 0,
                    });
                }
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="h-[160px] bg-white rounded-2xl shadow-sm border border-gray-100 animate-pulse flex items-center justify-center">
                    <span className="text-sm font-medium text-slate-300 tracking-widest uppercase font-figtree">Loading...</span>
                </div>
            ))}
        </div>
    );

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 group/stats">
            {/* Total Products (Hero Card) */}
            <div className="group relative bg-[#0E4D55] p-7 rounded-2xl shadow-lg border border-[#0E4D55]/50 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                {/* Background Details */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none transition-transform duration-700 group-hover:scale-150" />
                <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                
                <div className="flex items-center justify-between mb-6 relative z-10">
                    <h3 className="text-white/70 text-xs font-bold uppercase tracking-[0.2em] font-figtree">Catalog Items</h3>
                    <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/5 shadow-inner transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
                        <Package size={20} className="text-teal-200" />
                    </div>
                </div>
                <div className="flex items-baseline gap-3 relative z-10">
                    <p className="text-5xl font-kamundi font-medium tracking-tight text-white drop-shadow-sm">
                        {stats.productCount}
                    </p>
                </div>
                <p className="text-sm text-teal-100 mt-2 font-medium relative z-10 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span> Active Online
                </p>
            </div>

            {/* Today's Views */}
            <div className="group relative bg-white p-7 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 transition-all duration-300 hover:border-blue-100 hover:shadow-[0_8px_30px_-4px_rgba(37,99,235,0.1)] hover:-translate-y-1 overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity duration-300 translate-x-4 -translate-y-4">
                    <Eye size={120} className="text-blue-600" />
                </div>
                <div className="flex items-center justify-between mb-6 relative z-10">
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] font-figtree">Today&apos;s Traffic</h3>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100/50 transition-transform duration-300 group-hover:scale-110">
                        <Eye size={20} className="text-blue-600" />
                    </div>
                </div>
                <div className="flex items-baseline gap-3 relative z-10">
                    <p className="text-5xl font-kamundi font-medium text-slate-800 tracking-tight">
                        {stats.todayViews.toLocaleString()}
                    </p>
                </div>
                <p className="text-sm text-slate-400 mt-2 font-medium relative z-10">Page views in 24h</p>
            </div>

            {/* Registered Users */}
            <div className="group relative bg-white p-7 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 transition-all duration-300 hover:border-indigo-100 hover:shadow-[0_8px_30px_-4px_rgba(79,70,229,0.1)] hover:-translate-y-1 overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity duration-300 translate-x-4 -translate-y-4">
                    <Users size={120} className="text-indigo-600" />
                </div>
                <div className="flex items-center justify-between mb-6 relative z-10">
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] font-figtree">Total Audience</h3>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100/50 transition-transform duration-300 group-hover:scale-110">
                        <Users size={20} className="text-indigo-600" />
                    </div>
                </div>
                <div className="flex items-baseline gap-3 relative z-10">
                    <p className="text-5xl font-kamundi font-medium text-slate-800 tracking-tight">
                        {stats.userCount.toLocaleString()}
                    </p>
                </div>
                <p className="text-sm text-slate-400 mt-2 font-medium relative z-10">Verified accounts</p>
            </div>

            {/* Total Page Views */}
            <div className="group relative bg-white p-7 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 transition-all duration-300 hover:border-emerald-100 hover:shadow-[0_8px_30px_-4px_rgba(16,185,129,0.1)] hover:-translate-y-1 overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity duration-300 translate-x-4 -translate-y-4">
                    <TrendingUp size={120} className="text-emerald-600" />
                </div>
                <div className="flex items-center justify-between mb-6 relative z-10">
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] font-figtree">Lifetime Views</h3>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100/50 transition-transform duration-300 group-hover:scale-110">
                        <TrendingUp size={20} className="text-emerald-600" />
                    </div>
                </div>
                <div className="flex items-baseline gap-3 relative z-10">
                    <p className="text-5xl font-kamundi font-medium text-slate-800 tracking-tight">
                        {stats.totalViews.toLocaleString()}
                    </p>
                </div>
                <p className="text-sm text-slate-400 mt-2 font-medium relative z-10">Global aggregated traffic</p>
            </div>
        </div>
    );
}
