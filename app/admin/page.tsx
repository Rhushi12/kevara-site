"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import DashboardStats from "@/components/admin/DashboardStats";
import AnalyticsCharts from "@/components/admin/AnalyticsCharts";

import TopProducts from "@/components/admin/TopProducts";
import InventoryAlerts from "@/components/admin/InventoryAlerts";
import QuickActions from "@/components/admin/QuickActions";
import InventoryManager from "@/components/admin/InventoryManager";
import UsersTable from "@/components/admin/UsersTable";
import MenuEditor from "@/components/admin/MenuEditor";
import AdminManager from "@/components/admin/AdminManager";
import SeoSettings from "@/components/admin/SeoSettings";
import WholesaleLeadsTable from "@/components/admin/WholesaleLeadsTable";
import ProductsTable from "@/components/admin/ProductsTable";
import OrdersTable from "@/components/admin/OrdersTable";
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

    // Orphan Cleanup Logic
    const [cleaning, setCleaning] = useState(false);
    const [cleanupMessage, setCleanupMessage] = useState("");

    const cleanupOrphans = async () => {
        if (!confirm("This will remove orphaned product references from all pages. Continue?")) return;
        setCleaning(true);
        setCleanupMessage("");
        try {
            const res = await fetch('/api/products/cleanup-orphaned', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                setCleanupMessage(data.message || "Cleanup completed successfully.");
            } else {
                setCleanupMessage(`Error: ${data.error || "Unknown error"}`);
            }
        } catch (error: any) {
            setCleanupMessage(`Error: ${error.message}`);
        } finally {
            setCleaning(false);
        }
    };
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
                    <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-2 pb-12">
                        <div className="flex justify-between items-end pb-4 border-b border-gray-200/60">
                            <div>
                                <h1 className="text-3xl font-lora font-medium text-slate-900 tracking-tight">Dashboard Overview</h1>
                                <p className="text-slate-500 text-sm mt-1">Welcome back, {user.displayName?.split(' ')[0]}</p>
                            </div>
                            <span className="text-[10px] uppercase tracking-widest font-bold text-[#0E4D55] bg-[#0E4D55]/5 px-3 py-1.5 rounded-full border border-[#0E4D55]/10 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Live Data
                            </span>
                        </div>
                        <DashboardStats />
                        <AnalyticsCharts />

                        <TopProducts />

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="col-span-1 lg:col-span-1">
                                <InventoryAlerts />
                            </div>
                            <div className="col-span-1 lg:col-span-2">
                                <QuickActions onNavigate={setActiveTab} />
                            </div>
                        </div>
                    </div>
                );
            case "orders":
                return (
                    <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-2">
                        <div className="pb-4 border-b border-gray-200/60">
                            <h1 className="text-3xl font-lora font-medium text-slate-900 tracking-tight">Order Management</h1>
                            <p className="text-slate-500 text-sm mt-1">Track, manage, and fulfill customer orders.</p>
                        </div>
                        <OrdersTable />
                    </div>
                );
            case "wholesale":
                return (
                    <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-2">
                        <div className="pb-4 border-b border-gray-200/60">
                            <h1 className="text-3xl font-lora font-medium text-slate-900 tracking-tight">Wholesale Inquiries</h1>
                            <p className="text-slate-500 text-sm mt-1">Manage B2B and bulk product lead requests.</p>
                        </div>
                        <WholesaleLeadsTable />
                    </div>
                );
            case "leads":
                return (
                    <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-2">
                        <div className="pb-4 border-b border-gray-200/60">
                            <h1 className="text-3xl font-lora font-medium text-slate-900 tracking-tight">Users & Accounts</h1>
                            <p className="text-slate-500 text-sm mt-1">Real-time list of all registered store accounts.</p>
                        </div>
                        <UsersTable />
                    </div>
                );

            case "products":
                return (
                    <div className="space-y-6 animate-in fade-in duration-500 slide-in-from-bottom-2">
                        <div className="pb-4 border-b border-gray-200/60">
                            <h1 className="text-3xl font-lora font-medium text-slate-900 tracking-tight">Product Catalog</h1>
                            <p className="text-slate-500 text-sm mt-1">Manage inventory, prices, and stock visibility.</p>
                        </div>
                        <ProductsTable onAddProduct={() => window.open('/admin/products/new', '_blank')} />
                    </div>
                );

            case "inventory":
                return (
                    <div className="space-y-6 animate-in fade-in duration-500 slide-in-from-bottom-2">
                        <div className="pb-4 border-b border-gray-200/60">
                            <h1 className="text-3xl font-lora font-medium text-slate-900 tracking-tight">Inventory Manager</h1>
                            <p className="text-slate-500 text-sm mt-1">Monitor stock levels, track inventory health, and manage variants.</p>
                        </div>
                        <InventoryManager />
                    </div>
                );

            case "cms":
                return (
                    <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-2">
                        <div className="pb-4 border-b border-gray-200/60">
                            <h1 className="text-3xl font-lora font-medium text-slate-900 tracking-tight">Content Editor</h1>
                            <p className="text-slate-500 text-sm mt-1">Edit menus, navigation, and page content.</p>
                        </div>
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200/60">
                            <MenuEditor />
                        </div>
                    </div>
                );

            case "seo":
                return (
                    <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-2">
                        <div className="pb-4 border-b border-gray-200/60">
                            <h1 className="text-3xl font-lora font-medium text-slate-900 tracking-tight">SEO & Social Sharing</h1>
                            <p className="text-slate-500 text-sm mt-1">Configure how your site appears on Google & Social Media.</p>
                        </div>
                        <SeoSettings />
                    </div>
                );
            case "settings":
                return (
                    <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-2">
                        <div className="pb-4 border-b border-gray-200/60">
                            <h1 className="text-3xl font-lora font-medium text-slate-900 tracking-tight">System Settings</h1>
                            <p className="text-slate-500 text-sm mt-1">Manage admins and system configuration.</p>
                        </div>

                        {/* Admin Management */}
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200/60 max-w-2xl">
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

                        {/* Orphan Cleanup */}
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-xl">
                            <h3 className="font-bold mb-2">Orphaned Product Cleanup</h3>
                            <p className="text-sm text-slate-500 mb-4">Remove references to deleted products from all page sections. Prevents broken links and missing product cards.</p>
                            <LiquidButton
                                onClick={cleanupOrphans}
                                disabled={cleaning}
                                className="w-full bg-amber-600 text-white py-3 rounded"
                            >
                                {cleaning ? "Scanning..." : "Run Orphan Cleanup"}
                            </LiquidButton>
                            {cleanupMessage && <p className="mt-4 text-sm text-[#0E4D55]">{cleanupMessage}</p>}
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
            <main className="flex-grow p-8 md:p-12 overflow-y-auto h-screen ml-[72px]">
                {renderContent()}
            </main>
        </div>
    );
}
