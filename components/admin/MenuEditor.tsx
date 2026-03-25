"use client";

import { useState, useEffect } from "react";
import { MenuItem } from "@/lib/menuData";
import { saveNavigationMenu } from "@/lib/db";
import { adminFetch } from "@/lib/admin-fetch";
import { Plus, Link2, Route, GitCommitVertical, CornerDownRight, Check, X, Edit2, LayoutTemplate } from "lucide-react";
import { TEMPLATE_1, TEMPLATE_2, TEMPLATE_3 } from "@/lib/templates";

// Temporary placeholder for homepage template to avoid async import complexities inline
// In a real scenario, this would import correctly.
const TEMPLATE_HOMEPAGE = TEMPLATE_1; 

export default function MenuEditor() {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [newItemLabel, setNewItemLabel] = useState("");
    const [newItemUrl, setNewItemUrl] = useState("");
    
    // Inline editing state
    const [editingBranch, setEditingBranch] = useState<{ catIndex: number; colIndex: number; itemIndex: number; label: string } | null>(null);

    // Modal state for template selection
    const [pendingBranch, setPendingBranch] = useState<{ catIndex: number; label: string; url: string } | null>(null);
    const [isCreatingPage, setIsCreatingPage] = useState(false);

    useEffect(() => {
        const fetchMenu = async () => {
            try {
                const res = await adminFetch('/api/admin/menu');
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

    // -------- INLINE RENAMING LOGIC --------
    const startEditing = (catIndex: number, colIndex: number, itemIndex: number, currentLabel: string) => {
        setEditingBranch({ catIndex, colIndex, itemIndex, label: currentLabel });
    };

    const saveEdit = async () => {
        if (!editingBranch || !editingBranch.label.trim()) return;
        
        const { catIndex, colIndex, itemIndex, label } = editingBranch;
        const updatedMenu = [...menuItems];
        updatedMenu[catIndex].columns![colIndex].items[itemIndex].label = label.trim();
        
        try {
            await saveNavigationMenu(updatedMenu);
            setMenuItems(updatedMenu);
            setMessage("Branch identifier successfully updated.");
        } catch (error: any) {
            setMessage(`Update failed: ${error.message}`);
        } finally {
            setEditingBranch(null);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    // -------- NEW BRANCH & MODAL LOGIC --------
    const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>, categoryLabel: string) => {
        const label = e.target.value;
        setNewItemLabel(label);

        const catSlug = categoryLabel.toLowerCase().replace(/\s+/g, "-");
        const linkSlug = label.toLowerCase().replace(/\s+/g, "-");
        setNewItemUrl(`/collections/${catSlug}-${linkSlug}`);
    };

    const triggerModal = (categoryIndex: number) => {
        if (!newItemLabel || !newItemUrl) return;
        setPendingBranch({ catIndex: categoryIndex, label: newItemLabel, url: newItemUrl });
    };

    const finalizeAddBranch = async (templateType: "template1" | "template2" | "template3" | "homepage" | "empty") => {
        if (!pendingBranch) return;
        setIsCreatingPage(true);
        setMessage("Compiling page matrix and extending topological branch...");

        try {
            const handle = pendingBranch.url.split("/").pop();
            
            // Only create page content if they selected a template (not empty)
            if (handle && templateType !== "empty") {
                let newContent;
                if (templateType === "homepage") {
                    newContent = JSON.parse(JSON.stringify(TEMPLATE_HOMEPAGE));
                } else if (templateType === "template2") {
                    newContent = JSON.parse(JSON.stringify(TEMPLATE_2));
                } else if (templateType === "template3") {
                    newContent = JSON.parse(JSON.stringify(TEMPLATE_3));
                } else {
                    newContent = JSON.parse(JSON.stringify(TEMPLATE_1));
                }

                // Try injecting the new title into the first hero slider
                const heroSection = newContent.sections?.find((s: any) => s.type === "hero_slider");
                if (heroSection && heroSection.settings.slides.length > 0) {
                    heroSection.settings.slides[0].heading = pendingBranch.label;
                    heroSection.settings.slides[0].subheading = "NEW ARRIVALS";
                }

                // Save new page content
                const saveRes = await fetch('/api/builder/content', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        handle: handle,
                        data: newContent,
                    }),
                });

                if (!saveRes.ok) throw new Error("Matrix compilation failed");
            }

            // Save the navigation link
            const { catIndex, label, url } = pendingBranch;
            const updatedMenu = [...menuItems];

            if (updatedMenu[catIndex].columns && updatedMenu[catIndex].columns!.length > 0) {
                updatedMenu[catIndex].columns![0].items.push({ label, href: url });
            } else {
                if (!updatedMenu[catIndex].columns) {
                    updatedMenu[catIndex].columns = [{ title: "General", items: [] }];
                }
                updatedMenu[catIndex].columns![0].items.push({ label, href: url });
            }

            await saveNavigationMenu(updatedMenu);
            setMessage("Topological branch finalized securely.");
            setNewItemLabel("");
            setNewItemUrl("");
            setActiveCategory(null);
            setPendingBranch(null);
        } catch (error: any) {
            setMessage(`Topological anomaly: ${error.message}`);
        } finally {
            setIsCreatingPage(false);
            setTimeout(() => setMessage(''), 4000);
        }
    };

    if (loading) return <div className="animate-pulse text-sm font-lora italic text-slate-400">Charting topological map...</div>;

    return (
        <div className="w-full max-w-5xl mx-auto relative">
            {/* --- PAGE CREATION MODAL OVERLAY --- */}
            {pendingBranch && (
                <div className="fixed inset-0 z-50 bg-[#FDFBF7]/90 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white border border-[#006D77]/20 shadow-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto align-top">
                        <div className="flex justify-between items-start border-b border-black/5 pb-6 mb-8">
                            <div>
                                <h2 className="text-3xl font-prata text-[#006D77] mb-2 flex items-center gap-3">
                                    <LayoutTemplate size={24} />
                                    Configure Endpoint Matrix
                                </h2>
                                <p className="font-lora italic text-slate-500 text-sm">
                                    Select a structural layout for your new branch <strong className="text-slate-900 border-b border-slate-300">"{pendingBranch.label}"</strong>.
                                </p>
                            </div>
                            <button 
                                onClick={() => setPendingBranch(null)}
                                className="text-slate-400 hover:text-rose-500 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {isCreatingPage ? (
                            <div className="py-24 flex flex-col items-center justify-center space-y-4">
                                <div className="w-8 h-8 rounded-full border-2 border-t-[#006D77] border-slate-200 animate-spin" />
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[#006D77]">Compiling Page Architecture...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Template 1 */}
                                <div onClick={() => finalizeAddBranch("template1")} className="border border-slate-200 hover:border-[#006D77] p-6 cursor-pointer group transition-all text-center">
                                    <h3 className="font-prata text-xl mb-2 group-hover:text-[#006D77] transition-colors">Classic Marketing</h3>
                                    <p className="font-lora italic text-xs text-slate-500 mb-6">Hero Slider, Shop Essentials, Lookbook</p>
                                    <div className="h-24 bg-slate-50 border border-slate-100 p-2 flex flex-col gap-2">
                                        <div className="w-full h-8 bg-slate-200" />
                                        <div className="flex gap-2 h-10"><div className="w-1/2 bg-slate-200"/><div className="w-1/2 bg-slate-200"/></div>
                                    </div>
                                </div>
                                {/* Template 2 */}
                                <div onClick={() => finalizeAddBranch("template2")} className="border border-slate-200 hover:border-[#006D77] p-6 cursor-pointer group transition-all text-center">
                                    <h3 className="font-prata text-xl mb-2 group-hover:text-[#006D77] transition-colors">Collection Editorial</h3>
                                    <p className="font-lora italic text-xs text-slate-500 mb-6">Scroll Banner, Promo Windows, Product Grid</p>
                                    <div className="h-24 bg-slate-50 border border-slate-100 p-2 flex flex-col gap-2 relative overflow-hidden">
                                        <div className="absolute top-2 left-2 right-2 h-6 bg-slate-200" />
                                        <div className="absolute top-10 left-2 w-[45%] h-12 bg-slate-200" />
                                        <div className="absolute top-10 right-2 w-[45%] h-12 bg-slate-200" />
                                    </div>
                                </div>
                                {/* Empty Link Only */}
                                <div onClick={() => finalizeAddBranch("empty")} className="border border-slate-200 hover:border-[#006D77] p-6 cursor-pointer group transition-all text-center md:col-span-2 bg-slate-50">
                                    <h3 className="font-prata text-xl mb-2 group-hover:text-[#006D77] transition-colors">Link Only (No Page Generation)</h3>
                                    <p className="font-lora italic text-xs text-slate-500">Only creates the navigation routing. Page content will need to be built later.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* -------------------------------------- */}

            {message && (
                <div className="mb-8 p-4 bg-white border border-[#006D77]/20 flex items-center gap-3 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
                    <span className="w-2 h-2 rounded-full bg-[#006D77] animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#006D77]">{message}</span>
                </div>
            )}

            {/* Tree Root */}
            <div className="flex items-center gap-4 mb-2">
                <div className="w-3 h-3 rounded-full bg-slate-900 shadow-[0_0_0_4px_rgba(15,23,42,0.1)]"></div>
                <h3 className="text-2xl font-prata text-slate-900">Kevara Domain (/)</h3>
            </div>

            <div className="ml-1 pl-6 border-l-2 border-slate-200/60 pb-8 space-y-8 pt-4">
                {menuItems.map((category, catIndex) => (
                    <div key={category.id} className="relative mt-2">
                        {/* Connecting Line to Category Node */}
                        <div className="absolute -left-6 top-5 w-6 h-[2px] bg-slate-200/60"></div>
                        
                        {/* Category Node */}
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-2 h-2 rounded-full bg-slate-400 absolute -left-[5px] top-[18px]"></div>
                            <div className="bg-white border border-slate-200 shadow-sm px-6 py-3 min-w-[200px] flex items-center justify-between group">
                                <span className="font-prata text-lg text-slate-900">{category.label}</span>
                                <Route size={16} className="text-slate-300" />
                            </div>
                        </div>

                        {/* Sub-tree branches */}
                        <div className="ml-6 pl-8 border-l border-dashed border-slate-300/60 space-y-6 pt-2 pb-4">
                            {category.columns?.map((col, colIndex) => (
                                <div key={colIndex} className="relative">
                                    <div className="absolute -left-8 top-3 w-8 h-[1px] border-b border-dashed border-slate-300/60"></div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                        <GitCommitVertical size={14} className="text-slate-300" />
                                        {col.title}
                                    </h4>
                                    
                                    <div className="ml-2 pl-4 border-l border-slate-200/40 space-y-3">
                                        {col.items.map((item, itemIndex) => {
                                            const isEditing = editingBranch?.catIndex === catIndex && editingBranch?.colIndex === colIndex && editingBranch?.itemIndex === itemIndex;

                                            return (
                                                <div key={itemIndex} className="relative flex items-center gap-3 group">
                                                    <div className="absolute -left-4 top-1/2 w-4 h-[1px] bg-slate-200/40"></div>
                                                    <CornerDownRight size={14} className="text-slate-300 absolute -left-[14px] top-1/2 -mt-[8px]" />
                                                    
                                                    <div className="flex items-center justify-between w-full max-w-md bg-white border border-slate-100 hover:border-[#006D77]/30 pl-4 py-2 hover:bg-[#FDFBF7] transition-all group/node">
                                                        
                                                        {isEditing ? (
                                                            <div className="flex items-center gap-2 w-full">
                                                                <input 
                                                                    autoFocus
                                                                    type="text"
                                                                    value={editingBranch.label}
                                                                    onChange={(e) => setEditingBranch({...editingBranch, label: e.target.value})}
                                                                    onKeyDown={(e) => { if(e.key === 'Enter') saveEdit(); else if(e.key === 'Escape') setEditingBranch(null); }}
                                                                    className="flex-grow bg-transparent border-b border-[#006D77] text-sm font-semibold text-[#006D77] focus:outline-none"
                                                                />
                                                                <button onClick={saveEdit} className="text-[#006D77] hover:bg-[#006D77]/10 p-1"><Check size={14}/></button>
                                                                <button onClick={() => setEditingBranch(null)} className="text-slate-400 hover:text-rose-500 p-1"><X size={14}/></button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                                                                <div className="flex items-center gap-3 pr-4">
                                                                    <div className="flex items-center gap-1">
                                                                        <Link2 size={12} className="text-slate-300" />
                                                                        <span className="text-[10px] text-slate-400 font-mono tracking-tighter max-w-[120px] truncate">{item.href}</span>
                                                                    </div>
                                                                    {/* Rename Action Button */}
                                                                    <button 
                                                                        onClick={() => startEditing(catIndex, colIndex, itemIndex, item.label)}
                                                                        className="opacity-0 group-hover/node:opacity-100 text-slate-400 hover:text-[#006D77] transition-all"
                                                                        title="Rename Identifier"
                                                                    >
                                                                        <Edit2 size={12} />
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            {/* Add Branch Node */}
                            <div className="relative mt-6">
                                <div className="absolute -left-8 top-1/2 w-8 h-[1px] border-b border-dashed border-slate-300/60"></div>
                                
                                {activeCategory === category.id ? (
                                    <div className="ml-0 bg-white border border-[#006D77]/20 shadow-[0_4px_20px_-5px_rgba(0,109,119,0.15)] p-6 max-w-lg mb-4 relative z-10">
                                        <h4 className="font-prata text-lg text-[#006D77] mb-4">Extend Topological Branch</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Endpoint Label</label>
                                                <input
                                                    type="text"
                                                    value={newItemLabel}
                                                    onChange={(e) => handleLabelChange(e, category.label)}
                                                    className="w-full bg-transparent border-b border-slate-200 py-2 text-sm focus:outline-none focus:border-[#006D77] transition-colors"
                                                    placeholder="e.g. Autumn Classics"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Generated Route Path</label>
                                                <input
                                                    type="text"
                                                    value={newItemUrl}
                                                    readOnly
                                                    className="w-full border-b border-slate-200 py-2 text-[11px] font-mono text-slate-400 bg-slate-50/50 cursor-not-allowed px-2"
                                                />
                                            </div>
                                            <div className="flex justify-end gap-3 pt-4">
                                                <button
                                                    onClick={() => setActiveCategory(null)}
                                                    className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => triggerModal(catIndex)}
                                                    disabled={!newItemLabel}
                                                    className="px-6 py-2 bg-[#006D77] text-[#FDFBF7] text-[10px] font-bold uppercase tracking-widest hover:bg-[#004e55] transition-colors disabled:opacity-50 flex items-center gap-2"
                                                >
                                                    Config & Bridge <Plus size={12}/>
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
                                        className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-[#006D77] ml-2 group transition-colors"
                                    >
                                        <span className="w-5 h-5 flex items-center justify-center border border-slate-300 border-dashed rounded-full group-hover:border-[#006D77] group-hover:bg-[#006D77]/5 transition-colors">
                                            <Plus size={10} />
                                        </span>
                                        Extend Branch
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
