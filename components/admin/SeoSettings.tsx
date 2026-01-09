"use client";

import { useState, useEffect } from "react";
import ImageUploadModal from "@/components/admin/SimpleImageUploadModal";
import LiquidButton from "@/components/ui/LiquidButton";
import { Loader2, Save, Image as ImageIcon } from "lucide-react";

export default function SeoSettings() {
    const [config, setConfig] = useState({
        ogImage: "",
        description: "",
        title: "",
        keywords: "",
        social: { instagram: "", facebook: "", twitter: "" },
        enableSchema: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/admin/seo');
            if (res.ok) {
                const data = await res.json();
                setConfig({
                    ogImage: data.ogImage || "/og-image.jpg",
                    description: data.description || "",
                    title: data.title || "Kevara | Timeless Elegance",
                    keywords: data.keywords || "",
                    social: data.social || { instagram: "", facebook: "", twitter: "" },
                    enableSchema: data.enableSchema !== undefined ? data.enableSchema : true
                });
            }
        } catch (error) {
            console.error("Error fetching SEO config:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage("");
        try {
            const res = await fetch('/api/admin/seo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });

            if (!res.ok) throw new Error("Failed to save settings");
            setMessage("SEO settings updated successfully!");
        } catch (error: any) {
            setMessage(`Error: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (file: File) => {
        setSaving(true);
        try {
            // Upload to R2 via API
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'seo');

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!uploadRes.ok) throw new Error("Failed to upload image");

            const { url } = await uploadRes.json();
            setConfig(prev => ({ ...prev, ogImage: url }));
            setIsUploadModalOpen(false);
            setMessage("Image uploaded! Don't forget to save changes.");
        } catch (error: any) {
            console.error("Upload error:", error);
            setMessage(`Upload Error: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;

    return (
        <div className="space-y-8 max-w-3xl">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-lora font-bold text-xl mb-6">SEO Configuration</h3>
                <p className="text-sm text-gray-500 mb-6">
                    Manage how your site appears in browser tabs, Google Search, and social media.
                </p>

                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Preview */}
                    <div className="w-full md:w-1/2">
                        <div className="aspect-[1.91/1] bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative group">
                            {config.ogImage ? (
                                <img
                                    src={config.ogImage}
                                    alt="Social Preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                    <ImageIcon size={48} />
                                </div>
                            )}

                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    onClick={() => setIsUploadModalOpen(true)}
                                    className="px-4 py-2 bg-white text-slate-900 rounded font-medium text-sm hover:bg-gray-100"
                                >
                                    Change Image
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-center text-gray-400 mt-2">OpenGraph Image (1200 x 630)</p>
                    </div>

                    {/* Inputs */}
                    <div className="w-full md:w-1/2 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Browser Page Title</label>
                            <input
                                type="text"
                                value={config.title}
                                onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-[#0E4D55] outline-none"
                                placeholder="e.g., Kevara | Timeless Elegance"
                            />
                            <p className="text-xs text-gray-400 mt-1">This text appears in the browser tab.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Meta Keywords</label>
                            <textarea
                                value={config.keywords}
                                onChange={(e) => setConfig(prev => ({ ...prev, keywords: e.target.value }))}
                                className="w-full p-3 border rounded-lg text-sm h-24 resize-none focus:ring-2 focus:ring-[#0E4D55] outline-none"
                                placeholder="fashion, luxury, women's clothing, ethnic wear..."
                            />
                            <p className="text-xs text-gray-400 mt-1">Comma-separated keywords for search engines.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Default Description</label>
                            <textarea
                                value={config.description}
                                onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full p-3 border rounded-lg text-sm h-32 resize-none focus:ring-2 focus:ring-[#0E4D55] outline-none"
                                placeholder="Enter a default description for your site..."
                            />
                        </div>

                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <h4 className="font-medium text-slate-900">Social Media Links</h4>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Instagram URL</label>
                                    <input
                                        type="url"
                                        value={config.social?.instagram || ""}
                                        onChange={(e) => setConfig(prev => ({
                                            ...prev,
                                            social: { ...prev.social, instagram: e.target.value }
                                        }))}
                                        className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0E4D55] outline-none"
                                        placeholder="https://instagram.com/kevara"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Facebook URL</label>
                                    <input
                                        type="url"
                                        value={config.social?.facebook || ""}
                                        onChange={(e) => setConfig(prev => ({
                                            ...prev,
                                            social: { ...prev.social, facebook: e.target.value }
                                        }))}
                                        className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0E4D55] outline-none"
                                        placeholder="https://facebook.com/kevara"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Twitter (X) URL</label>
                                    <input
                                        type="url"
                                        value={config.social?.twitter || ""}
                                        onChange={(e) => setConfig(prev => ({
                                            ...prev,
                                            social: { ...prev.social, twitter: e.target.value }
                                        }))}
                                        className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0E4D55] outline-none"
                                        placeholder="https://twitter.com/kevara"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <label className="flex items-center justify-between cursor-pointer group">
                                <div>
                                    <span className="font-medium text-slate-900 block">Enable Organization Schema</span>
                                    <span className="text-xs text-gray-500">Automatically generate JSON-LD for better Google understanding.</span>
                                </div>
                                <div className={`w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${config.enableSchema ? 'bg-[#0E4D55]' : 'bg-gray-200'}`}>
                                    <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out mt-1 ml-1 ${config.enableSchema ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                                <input
                                    type="checkbox"
                                    checked={config.enableSchema}
                                    onChange={(e) => setConfig(prev => ({ ...prev, enableSchema: e.target.checked }))}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        <div className="pt-2">
                            <LiquidButton
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full bg-[#0E4D55] text-white py-3 rounded-lg flex items-center justify-center gap-2"
                            >
                                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                {saving ? "Saving..." : "Save Changes"}
                            </LiquidButton>
                            {message && (
                                <p className={`text-sm mt-3 text-center ${message.includes("Error") ? "text-red-500" : "text-green-600"}`}>
                                    {message}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ImageUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUpload={handleImageUpload}
                title="Upload Social Image"
                aspectRatio={1.91}
            />
        </div>
    );
}
