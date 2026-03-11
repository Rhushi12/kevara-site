"use client";

import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, ShoppingBag, Users, Eye, Package } from "lucide-react";

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
                const statsRes = await fetch('/api/admin/stats');
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="h-[140px] bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse flex items-center justify-center">
                    <span className="text-sm font-medium text-slate-400 tracking-widest uppercase">Loading...</span>
                </div>
            ))}
        </div>
    );

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            {/* Total Products */}
            <div className="bg-gradient-to-br from-[#0E4D55] to-[#0A3A40] p-6 rounded-xl shadow-md text-white border border-[#0E4D55]/20 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white/80 text-xs font-bold uppercase tracking-widest">Total Products</h3>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center relative z-10">
                        <Package size={16} className="text-emerald-300" />
                    </div>
                </div>
                <div className="flex items-baseline gap-3 relative z-10">
                    <p className="text-3xl font-lora font-medium tracking-tight">
                        {stats.productCount}
                    </p>
                </div>
                <p className="text-xs text-white/50 mt-2 font-medium relative z-10">Active catalog items</p>
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            </div>

            {/* Today's Views */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200/60 transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest">Today&apos;s Views</h3>
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                        <Eye size={16} className="text-blue-600" />
                    </div>
                </div>
                <div className="flex items-baseline gap-3">
                    <p className="text-3xl font-lora font-medium text-slate-900 tracking-tight">
                        {stats.todayViews.toLocaleString()}
                    </p>
                </div>
                <p className="text-xs text-slate-400 mt-2 font-medium">Page views today</p>
            </div>

            {/* Registered Users */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200/60 transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest">Registered Users</h3>
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                        <Users size={16} className="text-indigo-600" />
                    </div>
                </div>
                <div className="flex items-baseline gap-3">
                    <p className="text-3xl font-lora font-medium text-slate-900 tracking-tight">
                        {stats.userCount.toLocaleString()}
                    </p>
                </div>
                <p className="text-xs text-slate-400 mt-2 font-medium">Lifetime registered accounts</p>
            </div>

            {/* Total Page Views */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200/60 transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest">Total Views</h3>
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                        <TrendingUp size={16} className="text-emerald-600" />
                    </div>
                </div>
                <div className="flex items-baseline gap-3">
                    <p className="text-3xl font-lora font-medium text-slate-900 tracking-tight">
                        {stats.totalViews.toLocaleString()}
                    </p>
                </div>
                <p className="text-xs text-slate-400 mt-2 font-medium">All-time page views</p>
            </div>
        </div>
    );
}
