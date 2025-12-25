"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Users, Package, Eye } from "lucide-react";

export default function DashboardStats() {
    const [totalUsers, setTotalUsers] = useState<number | null>(null);
    const [productCount, setProductCount] = useState<number | null>(null);
    const [todayViews, setTodayViews] = useState<number | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const statsRes = await fetch('/api/admin/stats');
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setProductCount(statsData.productCount);
                    setTotalUsers(statsData.userCount);
                    setTodayViews(statsData.todayViews);
                }
            } catch (error) {
                console.error("Error fetching stats:", error);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            {/* Today's Views */}
            <div className="bg-gradient-to-br from-[#0E4D55] to-[#0A3A40] p-6 rounded-xl shadow-lg text-white">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white/80 text-sm font-medium uppercase tracking-wider">Today's Views</h3>
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                        <Eye size={20} className="text-white/80" />
                    </div>
                </div>
                <p className="text-4xl font-bold">
                    {todayViews === null ? "..." : todayViews.toLocaleString()}
                </p>
                <p className="text-xs text-white/60 mt-2">Page views today</p>
            </div>

            {/* Total Users */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Users</h3>
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                        <Users size={20} className="text-blue-500" />
                    </div>
                </div>
                <p className="text-3xl font-bold text-slate-800">
                    {totalUsers === null ? "..." : totalUsers}
                </p>
                <p className="text-xs text-gray-500 mt-1">Registered accounts</p>
            </div>

            {/* Products */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Catalog</h3>
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                        <Package size={20} className="text-amber-500" />
                    </div>
                </div>
                <p className="text-3xl font-bold text-slate-800">
                    {productCount === null ? "..." : productCount}
                </p>
                <span className="text-xs text-gray-400">Products in store</span>
            </div>

            {/* System Status */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Status</h3>
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                        <TrendingUp size={20} className="text-green-500" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-lg font-bold text-slate-800">Operational</p>
                </div>
                <span className="text-xs text-gray-400">All systems running</span>
            </div>
        </div>
    );
}

