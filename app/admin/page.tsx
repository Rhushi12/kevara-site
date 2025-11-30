"use client";

// export const dynamic = 'force-dynamic';
// export const fetchCache = 'force-no-store';
// export const revalidate = 0;

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LiquidButton from "@/components/ui/LiquidButton";
import { MOCK_SHOPIFY_PRODUCTS } from "@/lib/mockData";
import { db } from "@/lib/firebase";
import { collection, writeBatch, doc, setDoc } from "firebase/firestore";
import MenuEditor from "@/components/admin/MenuEditor";

export default function AdminPage() {
    const { user, isAdmin, loading } = useAuth();
    const router = useRouter();
    const [seeding, setSeeding] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!loading) {
            if (!user || !isAdmin) {
                router.push("/");
            }
        }
    }, [user, isAdmin, loading, router]);

    const seedDatabase = async () => {
        if (!confirm("Are you sure you want to seed the database? This might overwrite existing data.")) return;

        setSeeding(true);
        setMessage("Starting seed...");
        console.log("Starting seed process...");

        try {
            console.log("Initializing batch...");
            const batch = writeBatch(db);

            console.log(`Processing ${MOCK_SHOPIFY_PRODUCTS.length} products...`);
            MOCK_SHOPIFY_PRODUCTS.forEach((product) => {
                const docRef = doc(db, "products", product.node.handle);
                batch.set(docRef, product.node);
            });

            console.log("Committing batch...");
            await batch.commit();
            console.log("Batch commit successful!");
            setMessage(`Successfully added ${MOCK_SHOPIFY_PRODUCTS.length} products to Firestore.`);
        } catch (error: any) {
            console.error("Error seeding database:", error);
            setMessage(`Error: ${error.message || "Unknown error"}. Check console for details.`);
        } finally {
            setSeeding(false);
        }
    };

    const testConnection = async () => {
        try {
            setMessage("Testing connection...");
            console.log("Testing Firestore connection...");
            const testDoc = doc(db, "test_collection", "test_doc");
            await setDoc(testDoc, { test: true, timestamp: new Date() });
            console.log("Connection test successful!");
            setMessage("Connection successful! Firestore is reachable and writable.");
        } catch (error: any) {
            console.error("Connection test failed:", error);
            setMessage(`Connection failed: ${error.message}. Check console.`);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (!isAdmin) return null;

    return (
        <main className="bg-[#FDFBF7] min-h-screen flex flex-col">
            <Navbar />

            <div className="flex-grow container mx-auto px-4 py-24">
                <h1 className="text-3xl font-lora font-bold text-slate-900 mb-8">Admin Dashboard</h1>

                <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 max-w-2xl">
                    <h2 className="text-xl font-bold mb-4">Database Management</h2>
                    <p className="text-gray-600 mb-6">
                        Use this tool to populate the Firestore database with the initial mock data.
                        This will create a 'products' collection and add all items from `mockData.ts`.
                    </p>

                    <div className="flex items-center gap-4">
                        <LiquidButton
                            onClick={seedDatabase}
                            disabled={seeding}
                            className={`px-6 py-3 bg-[#006D77] text-white font-medium ${seeding ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#005a63]'}`}
                        >
                            {seeding ? "Seeding..." : "Seed Database with Mock Data"}
                        </LiquidButton>
                        <button
                            onClick={testConnection}
                            className="text-sm text-gray-500 hover:text-gray-700 underline"
                        >
                            Test Connection
                        </button>
                    </div>

                    {message && (
                        <div className={`mt-6 p-4 rounded-md ${message.includes("Error") || message.includes("failed") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                            {message}
                        </div>
                    )}
                </div>

                <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 max-w-4xl mt-8">
                    <h2 className="text-xl font-bold mb-4">Menu Management</h2>
                    <p className="text-gray-600 mb-6">
                        Manage navigation links. Adding a new link will automatically clone the "Women New" page template.
                    </p>
                    <MenuEditor />
                </div>
            </div>

            <Footer />
        </main>
    );
}
