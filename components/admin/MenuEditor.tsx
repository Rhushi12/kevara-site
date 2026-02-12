"use client";

import { useState, useEffect } from "react";
import { MenuItem } from "@/lib/menuData";
import { saveNavigationMenu } from "@/lib/db";
import LiquidButton from "@/components/ui/LiquidButton";

export default function MenuEditor() {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    // State for new item
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [newItemLabel, setNewItemLabel] = useState("");
    const [newItemUrl, setNewItemUrl] = useState("");
    const [isCloning, setIsCloning] = useState(false);

    useEffect(() => {
        const fetchMenu = async () => {
            try {
                const res = await fetch('/api/admin/menu');
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                setMenuItems(data.items || []);
            } catch (error) {
                console.error("Error fetching menu:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMenu();
    }, []);

    const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>, categoryLabel: string) => {
        const label = e.target.value;
        setNewItemLabel(label);

        // Auto-generate URL: /collections/{category-slug}-{link-slug}
        const catSlug = categoryLabel.toLowerCase().replace(/\s+/g, "-");
        const linkSlug = label.toLowerCase().replace(/\s+/g, "-");
        setNewItemUrl(`/collections/${catSlug}-${linkSlug}`);
    };

    const clonePage = async (targetHandle: string) => {
        try {
            // Source handle is 'women' (the template we just refactored)
            const sourceHandle = "women";


            // 1. Fetch source page content (Page Builder API)
            const res = await fetch(`/api/builder/content?handle=${sourceHandle}`);
            if (!res.ok) throw new Error("Failed to fetch source page data");
            const sourceData = await res.json();

            if (!sourceData || !sourceData.sections) {
                throw new Error("Source page data is empty or invalid");
            }

            // 2. Modify content for the new page (e.g., update Hero Title)
            const newContent = { ...sourceData };

            // Find Hero Slider and update title if possible
            const heroSection = newContent.sections.find((s: any) => s.type === "hero_slider");
            if (heroSection && heroSection.settings.slides.length > 0) {
                heroSection.settings.slides[0].heading = newItemLabel;
                heroSection.settings.slides[0].subheading = "NEW COLLECTION";
            }

            // 3. Save to new handle using Page Builder API
            const saveRes = await fetch('/api/builder/content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    handle: targetHandle,
                    data: newContent
                }),
            });

            if (!saveRes.ok) throw new Error("Failed to save new page data");

            return true;
        } catch (error) {
            console.error("Page cloning failed:", error);
            throw error;
        }
    };

    const handleAddItem = async (categoryIndex: number) => {
        if (!newItemLabel || !newItemUrl) return;

        setIsCloning(true);
        setMessage("Cloning page and adding link...");

        try {
            // Extract handle from URL
            // URL: /collections/some-handle
            const handle = newItemUrl.split("/").pop();

            if (handle) {
                await clonePage(handle);
            }

            const updatedMenu = [...menuItems];

            // Add to the first column's items if it exists
            if (updatedMenu[categoryIndex].columns && updatedMenu[categoryIndex].columns!.length > 0) {
                updatedMenu[categoryIndex].columns![0].items.push({
                    label: newItemLabel,
                    href: newItemUrl
                });
            } else {
                if (!updatedMenu[categoryIndex].columns) {
                    updatedMenu[categoryIndex].columns = [{ title: "General", items: [] }];
                }
                updatedMenu[categoryIndex].columns![0].items.push({
                    label: newItemLabel,
                    href: newItemUrl
                });
            }

            await saveNavigationMenu(updatedMenu);
            setMessage("Link added and page cloned successfully!");
            setNewItemLabel("");
            setNewItemUrl("");
            setActiveCategory(null);
        } catch (error: any) {
            setMessage(`Error: ${error.message}`);
        } finally {
            setIsCloning(false);
        }
    };

    if (loading) return <div>Loading menu...</div>;

    return (
        <div className="space-y-8">
            {menuItems.map((category, catIndex) => (
                <div key={category.id} className="border p-4 rounded-lg bg-gray-50">
                    <h3 className="font-bold text-lg mb-4">{category.label}</h3>

                    <div className="pl-4 border-l-2 border-gray-200 space-y-4">
                        {category.columns?.map((col, colIndex) => (
                            <div key={colIndex} className="mb-4">
                                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">{col.title}</h4>
                                <ul className="space-y-2">
                                    {col.items.map((item, itemIndex) => (
                                        <li key={itemIndex} className="text-sm flex justify-between group">
                                            <span>{item.label}</span>
                                            <span className="text-gray-400 text-xs">{item.href}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}

                        {activeCategory === category.id ? (
                            <div className="mt-4 p-4 bg-white rounded shadow-sm border">
                                <h4 className="font-medium mb-2">Add New Link to {category.label}</h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Link Name</label>
                                        <input
                                            type="text"
                                            value={newItemLabel}
                                            onChange={(e) => handleLabelChange(e, category.label)}
                                            className="w-full p-2 border rounded text-sm"
                                            placeholder="e.g. Summer Vibes"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Generated URL</label>
                                        <input
                                            type="text"
                                            value={newItemUrl}
                                            readOnly
                                            className="w-full p-2 border rounded text-sm bg-gray-50 text-gray-500"
                                        />
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <LiquidButton
                                            onClick={() => handleAddItem(catIndex)}
                                            disabled={isCloning || !newItemLabel}
                                            className="px-4 py-2 bg-[#006D77] text-white text-sm"
                                        >
                                            {isCloning ? "Cloning Page..." : "Add & Clone Page"}
                                        </LiquidButton>
                                        <button
                                            onClick={() => setActiveCategory(null)}
                                            className="px-4 py-2 text-gray-500 text-sm hover:bg-gray-100 rounded"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => {
                                    setActiveCategory(category.id);
                                    setNewItemLabel("");
                                    setNewItemUrl("");
                                }}
                                className="text-sm text-[#006D77] hover:underline mt-2 flex items-center gap-1"
                            >
                                + Add Link
                            </button>
                        )}
                    </div>
                </div>
            ))}

            {message && (
                <div className={`p-4 rounded ${message.includes("Error") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                    {message}
                </div>
            )}
        </div>
    );
}
