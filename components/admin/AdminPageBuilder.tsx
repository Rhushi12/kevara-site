"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TEMPLATE_1, TEMPLATE_2, TEMPLATE_3 } from "@/lib/templates";

interface AdminPageBuilderProps {
    slug: string;
}

export default function AdminPageBuilder({ slug }: AdminPageBuilderProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"template" | "redirect">("template");
    const [redirectUrl, setRedirectUrl] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleCreateFromTemplate = async (templateType: "template1" | "template2" | "template3" | "homepage" = "template1") => {
        setIsSaving(true);
        try {
            // 1. Prepare Content
            let newContent;
            if (templateType === "homepage") {
                // Dynamic import to avoid circular dependencies if any, or just use imported constant
                const { TEMPLATE_HOMEPAGE } = await import("@/lib/templates");
                newContent = JSON.parse(JSON.stringify(TEMPLATE_HOMEPAGE));
            } else if (templateType === "template2") {
                newContent = JSON.parse(JSON.stringify(TEMPLATE_2));
            } else if (templateType === "template3") {
                newContent = JSON.parse(JSON.stringify(TEMPLATE_3));
            } else {
                newContent = JSON.parse(JSON.stringify(TEMPLATE_1));
            }

            // 2. Save to API
            const res = await fetch("/api/builder/content", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ handle: slug, data: newContent }),
            });

            if (!res.ok) throw new Error("Failed to create page");

            // 3. Refresh to load the new page
            alert("Page created successfully! Reloading...");
            window.location.reload();

        } catch (error) {
            console.error("Failed to create page:", error);
            alert("Failed to create page. Check console.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateRedirect = async () => {
        if (!redirectUrl) return alert("Please enter a URL");
        setIsSaving(true);
        try {
            // Create a special "redirect" page content
            const redirectContent = {
                type: "redirect",
                target: redirectUrl
            };

            const res = await fetch("/api/builder/content", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ handle: slug, data: redirectContent }),
            });

            if (!res.ok) throw new Error("Failed to create redirect");

            alert("Redirect created! Reloading...");
            window.location.reload();

        } catch (error) {
            console.error("Failed to create redirect:", error);
            alert("Failed to create redirect.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
            <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8 border-b border-gray-100">
                    <h1 className="text-2xl font-lora font-semibold text-slate-900 mb-2">
                        Page Builder: <span className="text-[#006D77]">{slug}</span>
                    </h1>
                    <p className="text-slate-500">This page does not exist yet. What would you like to do?</p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab("template")}
                        className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === "template"
                            ? "bg-white text-[#006D77] border-b-2 border-[#006D77]"
                            : "bg-gray-50 text-slate-500 hover:bg-gray-100"
                            }`}
                    >
                        Use Template
                    </button>
                    <button
                        onClick={() => setActiveTab("redirect")}
                        className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === "redirect"
                            ? "bg-white text-[#006D77] border-b-2 border-[#006D77]"
                            : "bg-gray-50 text-slate-500 hover:bg-gray-100"
                            }`}
                    >
                        Route to Page
                    </button>
                </div>

                <div className="p-8">
                    {activeTab === "template" ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-4">
                                {/* Template 1 Card */}
                                <div className="border-2 border-[#006D77] rounded-xl p-6 bg-[#FDFBF7] relative overflow-hidden group cursor-pointer hover:shadow-md transition-all">
                                    <div className="absolute top-3 right-3 bg-[#006D77] text-white text-xs px-2 py-1 rounded-full">
                                        Selected
                                    </div>
                                    <h3 className="font-lora text-lg font-semibold mb-2">Template 1</h3>
                                    <p className="text-sm text-slate-600 mb-4">
                                        Standard marketing page with Hero Slider, Shop Essentials, Lookbook, and Collection Grid.
                                    </p>
                                    <div className="h-32 bg-gray-200 rounded-lg mb-4 overflow-hidden relative">
                                        {/* Mini Preview Mockup */}
                                        <div className="absolute inset-0 bg-slate-300 opacity-20"></div>
                                        <div className="absolute top-2 left-2 right-2 h-16 bg-white rounded shadow-sm"></div>
                                        <div className="absolute bottom-2 left-2 w-1/3 h-8 bg-white rounded shadow-sm"></div>
                                        <div className="absolute bottom-2 right-2 w-1/2 h-8 bg-white rounded shadow-sm"></div>
                                    </div>
                                </div>
                                {/* Template 2 Card */}
                                <div
                                    onClick={() => handleCreateFromTemplate("template2")}
                                    className="border-2 border-transparent hover:border-[#006D77] rounded-xl p-6 bg-[#FDFBF7] relative overflow-hidden group cursor-pointer hover:shadow-md transition-all"
                                >
                                    <h3 className="font-lora text-lg font-semibold mb-2">Template 2</h3>
                                    <p className="text-sm text-slate-600 mb-4">
                                        Collection page with scroll banner, promo windows, product grid, and essentials hero.
                                    </p>
                                    <div className="h-32 bg-gray-200 rounded-lg mb-4 overflow-hidden relative">
                                        <div className="absolute inset-0 bg-slate-300 opacity-20"></div>
                                        <div className="absolute top-2 left-2 right-2 h-8 bg-white rounded shadow-sm"></div>
                                        <div className="absolute top-12 left-2 w-1/3 h-16 bg-white rounded shadow-sm"></div>
                                        <div className="absolute top-12 right-2 w-1/2 h-16 bg-white rounded shadow-sm"></div>
                                    </div>
                                </div>
                                {/* Homepage Template Card */}
                                <div
                                    onClick={() => handleCreateFromTemplate("homepage")}
                                    className="border-2 border-transparent hover:border-[#006D77] rounded-xl p-6 bg-[#FDFBF7] relative overflow-hidden group cursor-pointer hover:shadow-md transition-all"
                                >
                                    <h3 className="font-lora text-lg font-semibold mb-2">Homepage Template</h3>
                                    <p className="text-sm text-slate-600 mb-4">
                                        The default homepage layout with all standard sections.
                                    </p>
                                    <div className="h-32 bg-gray-200 rounded-lg mb-4 overflow-hidden relative">
                                        <div className="absolute inset-0 bg-slate-300 opacity-20"></div>
                                        <div className="absolute top-2 left-2 right-2 h-16 bg-white rounded shadow-sm"></div>
                                    </div>
                                </div>
                                {/* Template 3 Card */}
                                <div
                                    onClick={() => handleCreateFromTemplate("template3")}
                                    className="border-2 border-transparent hover:border-[#006D77] rounded-xl p-6 bg-[#FDFBF7] relative overflow-hidden group cursor-pointer hover:shadow-md transition-all"
                                >
                                    <h3 className="font-lora text-lg font-semibold mb-2">Template 3</h3>
                                    <p className="text-sm text-slate-600 mb-4">
                                        Modern layout with category carousel, product grid with pagination, and Focal On You Instagram section.
                                    </p>
                                    <div className="h-32 bg-gray-200 rounded-lg mb-4 overflow-hidden relative">
                                        <div className="absolute inset-0 bg-slate-300 opacity-20"></div>
                                        <div className="absolute top-2 left-2 right-2 h-8 bg-white rounded shadow-sm"></div>
                                        <div className="absolute top-12 left-2 w-1/4 h-12 bg-white rounded shadow-sm"></div>
                                        <div className="absolute top-12 left-[28%] w-1/4 h-12 bg-white rounded shadow-sm"></div>
                                        <div className="absolute top-12 right-2 w-1/4 h-12 bg-white rounded shadow-sm"></div>
                                        <div className="absolute bottom-2 left-2 right-2 h-6 bg-[#E8F5F4] rounded shadow-sm"></div>
                                    </div>
                                </div>
                                {/* Placeholder for future templates */}
                                <div className="border border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400">
                                    <span className="text-2xl mb-2">+</span>
                                    <span className="text-sm">More templates coming soon</span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleCreateFromTemplate("template1")}
                                disabled={isSaving}
                                className="w-full bg-[#006D77] text-white py-4 rounded-lg font-medium shadow-lg hover:bg-[#005a63] transition-colors disabled:opacity-50"
                            >
                                {isSaving ? "Creating Page..." : "Create Page from Template 1"}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Target URL
                                </label>
                                <input
                                    type="text"
                                    value={redirectUrl}
                                    onChange={(e) => setRedirectUrl(e.target.value)}
                                    placeholder="/collections/all"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006D77] focus:border-transparent outline-none"
                                />
                                <p className="text-xs text-slate-500 mt-2">
                                    Users visiting <strong>/pages/{slug}</strong> will be immediately redirected to this URL.
                                </p>
                            </div>

                            <button
                                onClick={handleCreateRedirect}
                                disabled={isSaving}
                                className="w-full bg-slate-900 text-white py-4 rounded-lg font-medium shadow-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                            >
                                {isSaving ? "Saving Redirect..." : "Create Redirect"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
