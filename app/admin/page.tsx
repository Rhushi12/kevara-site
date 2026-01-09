"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import DashboardStats from "@/components/admin/DashboardStats";
import AnalyticsCharts from "@/components/admin/AnalyticsCharts";
import UsersTable from "@/components/admin/UsersTable";
import MenuEditor from "@/components/admin/MenuEditor";
import AdminManager from "@/components/admin/AdminManager";
import SeoSettings from "@/components/admin/SeoSettings";
import WholesaleLeadsTable from "@/components/admin/WholesaleLeadsTable";
import ProductsTable from "@/components/admin/ProductsTable";
import { db } from "@/lib/firebase";
import { collection, writeBatch, doc } from "firebase/firestore";
import { MOCK_SHOPIFY_PRODUCTS } from "@/lib/mockData";
import LiquidButton from "@/components/ui/LiquidButton";

export default function AdminPage() {
    const { user, isAdmin, loading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("dashboard");

    // Existing Seeding Logic
    const [seeding, setSeeding] = useState(false);
    const [message, setMessage] = useState("");
    const seedDatabase = async () => {
        if (!confirm("Are you sure?")) return;
        setSeeding(true);
        try {
            const batch = writeBatch(db);
            MOCK_SHOPIFY_PRODUCTS.forEach((product) => {
                const docRef = doc(db, "products", product.node.handle);
                batch.set(docRef, product.node);
            });
            await batch.commit();
            setMessage(`Success! Added ${MOCK_SHOPIFY_PRODUCTS.length} products.`);
        } catch (error: any) {
            setMessage(`Error: ${error.message}`);
        } finally {
            setSeeding(false);
        }
    };

    useEffect(() => {
        if (!loading) {
            // Use the isAdmin state from AuthContext (which checks NEXT_PUBLIC_ADMIN_EMAILS)
            if (!user || !isAdmin) {
                router.push("/");
            }
        }
    }, [user, isAdmin, loading, router]);

    if (loading) return <div className="min-h-screen flex items-center justify-center font-figtree text-gray-400">Authenticating...</div>;
    // Use isAdmin from context
    if (!user || !isAdmin) return null;

    const renderContent = () => {
        switch (activeTab) {
            case "dashboard":
                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="flex justify-between items-end">
                            <div>
                                <h1 className="text-2xl font-lora font-bold text-slate-900">Dashboard Overview</h1>
                                <p className="text-gray-500 text-sm">Welcome back, {user.displayName}</p>
                            </div>
                            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100">Live Data</span>
                        </div>
                        <DashboardStats />
                        <AnalyticsCharts />
                    </div>
                );
            case "wholesale":
                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div>
                            <h1 className="text-2xl font-lora font-bold text-slate-900">Wholesale Inquiries</h1>
                            <p className="text-gray-500 text-sm">Manage product lead requests.</p>
                        </div>
                        <WholesaleLeadsTable />
                    </div>
                );
            case "leads":
                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div>
                            <h1 className="text-2xl font-lora font-bold text-slate-900">Leads & Users</h1>
                            <p className="text-gray-500 text-sm">Real-time list of all registered accounts.</p>
                        </div>
                        <UsersTable />
                    </div>
                );

            case "products":
                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="flex justify-between items-end">
                            <div>
                                <h1 className="text-2xl font-lora font-bold text-slate-900">Product Catalog</h1>
                                <p className="text-gray-500 text-sm">Manage inventory, prices, and stock.</p>
                            </div>
                        </div>
                        <ProductsTable />
                    </div>
                );

            case "cms":
                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div>
                            <h1 className="text-2xl font-lora font-bold text-slate-900">Content Management</h1>
                            <p className="text-gray-500 text-sm">Edit menus and navigation.</p>
                        </div>
                        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
                            <MenuEditor />
                        </div>
                    </div>
                );

            case "seo":
                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div>
                            <h1 className="text-2xl font-lora font-bold text-slate-900">SEO & Social Sharing</h1>
                            <p className="text-gray-500 text-sm">Configure how your site appears on Google & Social Media.</p>
                        </div>
                        <SeoSettings />
                    </div>
                );
            case "settings":
                return (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div>
                            <h1 className="text-2xl font-lora font-bold text-slate-900">System Settings</h1>
                            <p className="text-gray-500 text-sm">Manage admins and system configuration.</p>
                        </div>

                        {/* Admin Management */}
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-2xl">
                            <AdminManager />
                        </div>

                        {/* Database Tools */}
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-xl">
                            <h3 className="font-bold mb-4">Database Seeding</h3>
                            <LiquidButton
                                onClick={seedDatabase}
                                disabled={seeding}
                                className="w-full bg-slate-900 text-white py-3 rounded"
                            >
                                {seeding ? "Seeding..." : "Reset Product Database"}
                            </LiquidButton>
                            {message && <p className="mt-4 text-sm text-[#0E4D55]">{message}</p>}
                        </div>
                    </div>
                );
            default:
                return <div className="p-12 text-center text-gray-400">Module coming soon.</div>;
        }
    };

    return (
        <div className="flex min-h-screen bg-[#FDFBF7]">
            <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <main className="flex-grow p-8 md:p-12 overflow-y-auto h-screen">
                {renderContent()}
            </main>
        </div>
    );
}
