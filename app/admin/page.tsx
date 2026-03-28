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
import LogisticsDashboard from "@/components/admin/LogisticsDashboard";
import AdminDiscounts from "@/components/admin/AdminDiscounts";
import { db } from "@/lib/firebase";
import { collection, writeBatch, doc } from "firebase/firestore";
import { MOCK_SHOPIFY_PRODUCTS } from "@/lib/mockData";
import LiquidButton from "@/components/ui/LiquidButton";

export default function AdminPage() {
    const { user, isAdmin, loading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("dashboard");

    const [seeding, setSeeding] = useState(false);
    const [message, setMessage] = useState("");

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
            if (!user || !isAdmin) {
                router.push("/");
            }
        }
    }, [user, isAdmin, loading, router]);

    if (loading) return <div className="min-h-screen flex items-center justify-center font-figtree text-slate-400 bg-[#FDFBF7]">Authenticating...</div>;
    if (!user || !isAdmin) return null;

    const renderContent = () => {
        switch (activeTab) {
            case "dashboard":
                return (
                    <div className="space-y-12 animate-in fade-in duration-500 slide-in-from-bottom-2 pb-12">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-8 border-b border-slate-200 gap-4">
                            <div>
                                <h1 className="text-5xl font-kamundi text-slate-900 tracking-tight mb-2">Dashboard Overview</h1>
                                <p className="font-figtree text-slate-500 text-sm tracking-widest uppercase font-medium">Welcome back, {user.displayName?.split(' ')[0]}</p>
                            </div>
                            <span className="text-[10px] uppercase tracking-widest font-bold text-[#006D77] border border-[#006D77]/20 bg-teal-50/50 rounded-full px-4 py-2 flex items-center gap-3 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#006D77] animate-pulse"></span>
                                Live Data Connection
                            </span>
                        </div>
                        
                        <DashboardStats />
                        
                        <div className="my-12">
                            <AnalyticsCharts />
                        </div>

                        <div className="my-12">
                            <TopProducts />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 my-12">
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
                    <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-2 pb-12">
                        <div className="pb-8 border-b border-black/5 mb-8">
                            <h1 className="text-4xl font-prata text-slate-900 tracking-tight mb-2">Order Management</h1>
                            <p className="font-lora italic text-slate-500 text-lg">Track, manage, and fulfill customer orders.</p>
                        </div>
                        <OrdersTable />
                    </div>
                );
            case "logistics":
                return (
                    <LogisticsDashboard />
                );
            case "wholesale":
                return (
                    <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-2 pb-12">
                        <div className="pb-8 border-b border-black/5 mb-8">
                            <h1 className="text-4xl font-prata text-slate-900 tracking-tight mb-2">Wholesale Inquiries</h1>
                            <p className="font-lora italic text-slate-500 text-lg">Manage B2B and bulk product lead requests.</p>
                        </div>
                        <WholesaleLeadsTable />
                    </div>
                );
            case "discounts":
                return (
                    <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-2 pb-12">
                        <div className="pb-8 border-b border-black/5 mb-8">
                            <h1 className="text-4xl font-prata text-slate-900 tracking-tight mb-2">Discount Manager</h1>
                            <p className="font-lora italic text-slate-500 text-lg">Create and manage Shopify discount codes, sales, and special offers.</p>
                        </div>
                        <AdminDiscounts />
                    </div>
                );
            case "leads":
                return (
                    <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-2 pb-12">
                        <div className="pb-8 border-b border-black/5 mb-8">
                            <h1 className="text-4xl font-prata text-slate-900 tracking-tight mb-2">Users & Accounts</h1>
                            <p className="font-lora italic text-slate-500 text-lg">Real-time list of all registered store accounts.</p>
                        </div>
                        <UsersTable />
                    </div>
                );

            case "products":
                return (
                    <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-2 pb-12">
                        <div className="pb-8 border-b border-black/5 mb-8">
                            <h1 className="text-4xl font-prata text-slate-900 tracking-tight mb-2">Product Catalog</h1>
                            <p className="font-lora italic text-slate-500 text-lg">Manage inventory, prices, and stock visibility.</p>
                        </div>
                        <ProductsTable onAddProduct={() => window.open('/admin/products/new', '_blank')} />
                    </div>
                );

            case "inventory":
                return (
                    <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-2 pb-12">
                        <div className="pb-8 border-b border-black/5 mb-8">
                            <h1 className="text-4xl font-prata text-slate-900 tracking-tight mb-2">Inventory Manager</h1>
                            <p className="font-lora italic text-slate-500 text-lg">Monitor stock levels, track inventory health, and manage variants.</p>
                        </div>
                        <InventoryManager />
                    </div>
                );

            case "cms":
                return (
                    <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-2 pb-12">
                        <div className="pb-8 border-b border-black/5 mb-8">
                            <h1 className="text-4xl font-prata text-slate-900 tracking-tight mb-2">Content View</h1>
                            <p className="font-lora italic text-slate-500 text-lg">A topological map of your site structure, collections, and pages.</p>
                        </div>
                        <div className="bg-[#FDFBF7] p-4 md:p-8">
                            <MenuEditor />
                        </div>
                    </div>
                );

            case "seo":
                return (
                    <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-2 pb-12">
                        <div className="pb-8 border-b border-black/5 mb-8">
                            <h1 className="text-4xl font-prata text-slate-900 tracking-tight mb-2">SEO & Social Sharing</h1>
                            <p className="font-lora italic text-slate-500 text-lg">Configure how your site appears on Google & Social Media.</p>
                        </div>
                        <SeoSettings />
                    </div>
                );
            case "settings":
                return (
                    <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-2 pb-12">
                        <div className="pb-8 border-b border-black/5 mb-8">
                            <h1 className="text-4xl font-prata text-slate-900 tracking-tight mb-2">System Settings</h1>
                            <p className="font-lora italic text-slate-500 text-lg">Manage admins and system configuration.</p>
                        </div>

                        {/* Admin Management */}
                        <div className="bg-white p-10 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 rounded-sm max-w-3xl mb-8">
                            <AdminManager />
                        </div>

                        {/* Database Tools */}
                        <div className="bg-white p-10 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 rounded-sm max-w-3xl mb-8">
                            <h3 className="font-prata text-xl mb-4 border-b border-black/5 pb-4">Database Seeding</h3>
                            <button
                                onClick={seedDatabase}
                                disabled={seeding}
                                className="w-full bg-[#006D77] text-[#FDFBF7] py-4 text-xs font-bold uppercase tracking-widest hover:bg-[#004e55] transition-colors disabled:opacity-50"
                            >
                                {seeding ? "Seeding Database..." : "Reset Product Database"}
                            </button>
                            {message && <p className="mt-6 text-[11px] font-bold uppercase tracking-widest text-[#006D77] p-4 bg-[#FDFBF7] border border-[#006D77]/20">{message}</p>}
                        </div>

                        {/* Orphan Cleanup */}
                        <div className="bg-white p-10 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 rounded-sm max-w-3xl">
                            <h3 className="font-prata text-xl mb-2 border-b border-black/5 pb-4">Orphaned Product Cleanup</h3>
                            <p className="font-lora italic text-slate-500 text-sm mt-4 mb-6">Remove references to deleted products from all page sections. Prevents broken links and missing product cards.</p>
                            <button
                                onClick={cleanupOrphans}
                                disabled={cleaning}
                                className="w-full bg-white border border-rose-200 text-rose-700 py-4 text-xs font-bold uppercase tracking-widest hover:bg-rose-50 transition-colors disabled:opacity-50"
                            >
                                {cleaning ? "Scanning for orphans..." : "Run Orphan Cleanup"}
                            </button>
                            {cleanupMessage && <p className="mt-6 text-[11px] font-bold uppercase tracking-widest text-[#006D77] p-4 bg-[#FDFBF7] border border-[#006D77]/20">{cleanupMessage}</p>}
                        </div>
                    </div>
                );
            default:
                return <div className="p-16 text-center text-slate-400 font-lora italic border border-slate-100 bg-white">Module coming soon.</div>;
        }
    };

    return (
        <div className="flex min-h-screen bg-[#FDFBF7] text-slate-900 font-figtree selection:bg-[#006D77]/20">
            <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <main className="flex-grow px-8 md:px-16 py-12 overflow-y-auto h-screen ml-[72px]">
                {renderContent()}
            </main>
        </div>
    );
}
