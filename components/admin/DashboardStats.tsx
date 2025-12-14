"use client";

import { useEffect, useState } from "react";
import { collection, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DashboardStats() {
    const [totalUsers, setTotalUsers] = useState<number | null>(null);
    const [productCount, setProductCount] = useState<number | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch Users Count
                const usersColl = collection(db, "users");
                const usersSnapshot = await getCountFromServer(usersColl);
                setTotalUsers(usersSnapshot.data().count);

                // Fetch Products Count
                // We typically seed products into 'products' collection in AdminPage
                const productsColl = collection(db, "products");
                const productsSnapshot = await getCountFromServer(productsColl);
                setProductCount(productsSnapshot.data().count);
            } catch (error) {
                console.error("Error fetching stats:", error);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Leads</h3>
                <p className="text-3xl font-bold text-[#0E4D55] mt-2">
                    {totalUsers === null ? "..." : totalUsers}
                </p>
                <p className="text-xs text-gray-500 mt-1">Registered accounts</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Catalog Items</h3>
                <p className="text-3xl font-bold text-slate-800 mt-2">
                    {productCount === null ? "..." : productCount}
                </p>
                <span className="text-xs text-gray-400">Products in database</span>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">System Status</h3>
                <div className="flex items-center gap-2 mt-2">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-lg font-bold text-slate-800">Operational</p>
                </div>
                <span className="text-xs text-gray-400">Lead capture active</span>
            </div>
        </div>
    );
}
