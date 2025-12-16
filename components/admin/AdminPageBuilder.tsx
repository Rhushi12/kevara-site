"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TEMPLATE_1, TEMPLATE_2, TEMPLATE_3 } from "@/lib/templates";
import { useToast } from "@/context/ToastContext";

interface AdminPageBuilderProps {
    slug: string;
}

export default function AdminPageBuilder({ slug }: AdminPageBuilderProps) {
    const router = useRouter();
    const { showToast } = useToast();
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

            // DEBUG: Log what we're about to send
            console.log(`[AdminPageBuilder] Creating page '${slug}' with template '${templateType}'`);
            console.log(`[AdminPageBuilder] Content to save:`, newContent);
            console.log(`[AdminPageBuilder] Sections count:`, newContent?.sections?.length);
            console.log(`[AdminPageBuilder] Section types:`, newContent?.sections?.map((s: any) => s?.type));

            // 2. Save to API
            const res = await fetch("/api/builder/content", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ handle: slug, data: newContent }),
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error("[AdminPageBuilder] API error:", errorText);
                throw new Error("Failed to create page");
            }

            // 3. Refresh to load the new page
            showToast("Page created successfully! Reloading...", "success");
            window.location.reload();

        } catch (error) {
            console.error("Failed to create page:", error);
            showToast("Failed to create page. Check console.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateRedirect = async () => {
        if (!redirectUrl) {
            showToast("Please enter a URL", "warning");
            return;
        }
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

            showToast("Redirect created! Reloading...", "success");
            window.location.reload();

        } catch (error) {
            console.error("Failed to create redirect:", error);
            showToast("Failed to create redirect.", "error");
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Template 1 Card */}
                                <div
                                    onClick={() => handleCreateFromTemplate("template1")}
                                    className="border-2 border-transparent hover:border-[#006D77] rounded-xl p-5 bg-[#FDFBF7] relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all"
                                >
                                    <div className="absolute top-2 right-2 bg-[#006D77] text-white text-[10px] px-2 py-0.5 rounded-full">
                                        Default
                                    </div>
                                    <h3 className="font-lora text-base font-semibold mb-1">Template 1</h3>
                                    <p className="text-xs text-slate-600 mb-3">
                                        Marketing page with Hero Slider, Shop Essentials, Lookbook
                                    </p>
                                    <div className="h-20 bg-gray-200 rounded-lg overflow-hidden relative">
                                        <div className="absolute top-1 left-1 right-1 h-8 bg-white rounded shadow-sm"></div>
                                        <div className="absolute bottom-1 left-1 w-1/3 h-5 bg-white rounded shadow-sm"></div>
                                        <div className="absolute bottom-1 right-1 w-1/2 h-5 bg-white rounded shadow-sm"></div>
                                    </div>
                                </div>

                                {/* Template 2 Card */}
                                <div
                                    onClick={() => handleCreateFromTemplate("template2")}
                                    className="border-2 border-transparent hover:border-[#006D77] rounded-xl p-5 bg-[#FDFBF7] relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all"
                                >
                                    <h3 className="font-lora text-base font-semibold mb-1">Template 2</h3>
                                    <p className="text-xs text-slate-600 mb-3">
                                        Collection page with Scroll Banner, Promo Windows, Product Grid
                                    </p>
                                    <div className="h-20 bg-gray-200 rounded-lg overflow-hidden relative">
                                        <div className="absolute top-1 left-1 right-1 h-6 bg-white rounded shadow-sm"></div>
                                        <div className="absolute top-8 left-1 w-[45%] h-10 bg-white rounded shadow-sm"></div>
                                        <div className="absolute top-8 right-1 w-[45%] h-10 bg-white rounded shadow-sm"></div>
                                    </div>
                                </div>

                                {/* Template 3 Card */}
                                <div
                                    onClick={() => handleCreateFromTemplate("template3")}
                                    className="border-2 border-transparent hover:border-[#006D77] rounded-xl p-5 bg-[#FDFBF7] relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all"
                                >
                                    <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                                        New
                                    </div>
                                    <h3 className="font-lora text-base font-semibold mb-1">Template 3</h3>
                                    <p className="text-xs text-slate-600 mb-3">
                                        Category Carousel, Product Grid with Filters, Focal On You
                                    </p>
                                    <div className="h-20 bg-gray-200 rounded-lg overflow-hidden relative">
                                        <div className="absolute top-1 left-1 w-1/4 h-8 bg-white rounded shadow-sm"></div>
                                        <div className="absolute top-1 left-[27%] w-1/4 h-8 bg-white rounded shadow-sm"></div>
                                        <div className="absolute top-1 right-1 w-1/4 h-8 bg-white rounded shadow-sm"></div>
                                        <div className="absolute bottom-1 left-1 right-1 h-6 bg-[#E8F5F4] rounded shadow-sm"></div>
                                    </div>
                                </div>

                                {/* Homepage Template Card */}
                                <div
                                    onClick={() => handleCreateFromTemplate("homepage")}
                                    className="border-2 border-transparent hover:border-[#006D77] rounded-xl p-5 bg-[#FDFBF7] relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all"
                                >
                                    <div className="absolute top-2 right-2 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                                        Full
                                    </div>
                                    <h3 className="font-lora text-base font-semibold mb-1">Homepage Template</h3>
                                    <p className="text-xs text-slate-600 mb-3">
                                        Full homepage with Hero, Sales, Grid, Video, Testimonials
                                    </p>
                                    <div className="h-20 bg-gray-200 rounded-lg overflow-hidden relative">
                                        <div className="absolute top-1 left-1 right-1 h-10 bg-white rounded shadow-sm"></div>
                                        <div className="absolute bottom-1 left-1 w-1/3 h-5 bg-[#006D77]/20 rounded shadow-sm"></div>
                                        <div className="absolute bottom-1 left-[35%] w-1/3 h-5 bg-white rounded shadow-sm"></div>
                                        <div className="absolute bottom-1 right-1 w-1/4 h-5 bg-white rounded shadow-sm"></div>
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-center text-slate-400">
                                Click any template to create your page instantly
                            </p>
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
