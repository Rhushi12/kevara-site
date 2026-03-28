"use client";

import { useState, useEffect } from "react";
import { Ticket, Plus, Trash2, Loader2, Tag } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";

interface DiscountNode {
    id: string;
    discount: {
        status: string;
        title: string;
        usageLimit: number | null;
        appliesOncePerCustomer: boolean;
        codes: {
            nodes: { code: string }[];
        };
        customerGets: {
            value: {
                percentage?: number;
                amount?: { amount: string; currencyCode: string };
            };
        };
    };
}

export default function AdminDiscounts() {
    const [discounts, setDiscounts] = useState<DiscountNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [isCreating, setIsCreating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [code, setCode] = useState("");
    const [type, setType] = useState<"percentage" | "fixed">("percentage");
    const [value, setValue] = useState("");
    const [oncePerCustomer, setOncePerCustomer] = useState(false);

    const fetchDiscounts = async () => {
        setLoading(true);
        try {
            const res = await adminFetch("/api/admin/discounts");
            if (!res.ok) throw new Error("Failed to fetch discounts");
            const data = await res.json();
            setDiscounts(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDiscounts();
    }, []);

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to permanently delete discount "${title}"?`)) return;
        
        try {
            const res = await adminFetch(`/api/admin/discounts?id=${encodeURIComponent(id)}`, {
                method: "DELETE",
            });
            
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Failed to delete discount. Backend returned " + res.status);
            }
            
            await fetchDiscounts();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code || !value) return alert("Please fill in code and value.");
        
        setIsSubmitting(true);
        try {
            const res = await adminFetch("/api/admin/discounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, type, value, oncePerCustomer })
            });
            
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create discount");
            }
            
            // Reset form and reload
            setCode("");
            setValue("");
            setOncePerCustomer(false);
            setIsCreating(false);
            await fetchDiscounts();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* ─── DISCOUNT COUPONS ─── */}
            <div className="bg-white p-8 md:p-10 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 rounded-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-2xl font-prata text-slate-900">Active Coupons</h2>
                        <p className="text-sm font-figtree text-slate-500 mt-1">Synced live with Shopify GraphQL</p>
                    </div>
                    <button
                        onClick={() => setIsCreating(!isCreating)}
                        className="flex items-center gap-2 bg-[#0E4D55] text-white px-5 py-2.5 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-[#0A3A40] transition-colors"
                    >
                        {isCreating ? "Cancel" : <><Plus size={16} /> Create Coupon</>}
                    </button>
                </div>

                {error && (
                    <div className="bg-rose-50 text-rose-700 p-4 rounded-lg mb-8 text-sm font-medium border border-rose-100">
                        {error}
                    </div>
                )}

                {isCreating && (
                    <form onSubmit={handleCreate} className="bg-[#FDFBF7] p-6 rounded-xl border border-[#006D77]/10 mb-8 space-y-6 animate-in slide-in-from-top-4 fade-in duration-300">
                        <h3 className="font-prata text-xl text-slate-900 mb-4 border-b border-black/5 pb-4">New Discount Code</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[#0E4D55]">Discount Code <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    placeholder="e.g. WELCOME10"
                                    className="w-full bg-white border border-gray-200 focus:border-[#0E4D55] focus:ring-1 focus:ring-[#0E4D55] rounded-xl px-4 py-3 text-sm font-bold text-slate-900 uppercase transition-all"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[#0E4D55]">Discount Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setType("percentage")}
                                        className={`py-3 text-sm font-bold uppercase tracking-wider rounded-xl border transition-all ${type === "percentage" ? "bg-[#0E4D55] text-white border-[#0E4D55]" : "bg-white text-slate-500 border-gray-200 hover:border-[#0E4D55] hover:text-[#0E4D55]"}`}
                                    >
                                        Percentage
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setType("fixed")}
                                        className={`py-3 text-sm font-bold uppercase tracking-wider rounded-xl border transition-all ${type === "fixed" ? "bg-[#0E4D55] text-white border-[#0E4D55]" : "bg-white text-slate-500 border-gray-200 hover:border-[#0E4D55] hover:text-[#0E4D55]"}`}
                                    >
                                        Fixed Amount
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[#0E4D55]">Discount Value <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={value}
                                        onChange={(e) => setValue(e.target.value)}
                                        placeholder={type === "percentage" ? "e.g. 15" : "e.g. 500"}
                                        min="1"
                                        step={type === "percentage" ? "1" : "any"}
                                        className="w-full bg-white border border-gray-200 focus:border-[#0E4D55] focus:ring-1 focus:ring-[#0E4D55] rounded-xl px-4 py-3 pl-10 text-sm font-medium transition-all"
                                        required
                                    />
                                    <span className="absolute left-4 top-[14px] text-slate-400 font-bold">
                                        {type === "percentage" ? "%" : "₹"}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2 flex flex-col justify-center">
                                <label className="flex items-center gap-3 cursor-pointer group mt-4">
                                    <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${oncePerCustomer ? "bg-[#0E4D55] border-[#0E4D55]" : "bg-white border-gray-300 group-hover:border-[#0E4D55]"}`}>
                                        {oncePerCustomer && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                                    </div>
                                    <span className="text-sm font-medium text-slate-700">Limit to one use per customer</span>
                                    <input type="checkbox" className="hidden" checked={oncePerCustomer} onChange={(e) => setOncePerCustomer(e.target.checked)} />
                                </label>
                                <p className="text-[10px] text-slate-400 ml-9 leading-relaxed">Highly recommended for Welcome codes to prevent abuse.</p>
                            </div>
                        </div>

                        <div className="flex justify-end border-t border-black/5 pt-6">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-[#0E4D55] text-white px-8 py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-[#0A3A40] transition-colors shadow-lg shadow-[#0E4D55]/20 disabled:opacity-70 flex items-center gap-2"
                            >
                                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                                {isSubmitting ? "Creating in Shopify..." : "Publish Discount"}
                            </button>
                        </div>
                    </form>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-20 text-[#006D77]">
                        <Loader2 className="animate-spin w-8 h-8" />
                    </div>
                ) : discounts.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-2xl">
                        <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-prata text-slate-900 mb-1">No active discounts</h3>
                        <p className="text-sm text-slate-500 font-figtree">Click Create Coupon above to generate your first promotion.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-[10px] text-slate-400 uppercase tracking-widest bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-4 font-bold rounded-tl-xl">Code</th>
                                    <th className="px-6 py-4 font-bold">Value</th>
                                    <th className="px-6 py-4 font-bold">Status</th>
                                    <th className="px-6 py-4 font-bold">Rules</th>
                                    <th className="px-6 py-4 font-bold text-right rounded-tr-xl">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {discounts.map((node) => {
                                    const code = node.discount.codes.nodes[0]?.code || node.discount.title;
                                    const isPercentage = !!node.discount.customerGets.value.percentage;
                                    const val = isPercentage 
                                        ? `${(node.discount.customerGets.value.percentage! * 100).toFixed(0)}% OFF`
                                        : `₹${node.discount.customerGets.value.amount?.amount} OFF`;

                                    return (
                                        <tr key={node.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-[#0E4D55] shrink-0">
                                                        <Tag size={18} />
                                                    </div>
                                                    <span className="font-bold text-slate-900 uppercase tracking-wider">{code}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-[#FDFBF7] text-[#0E4D55] border border-[#0E4D55]/10">
                                                    {val}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {node.discount.status === 'ACTIVE' 
                                                    ? <span className="text-emerald-600 font-bold text-xs uppercase tracking-widest flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active</span>
                                                    : <span className="text-gray-500 font-bold text-xs uppercase tracking-widest flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> {node.discount.status}</span>
                                                }
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1 text-[11px] text-slate-500">
                                                    {node.discount.appliesOncePerCustomer ? (
                                                        <span className="text-[#0E4D55] font-medium bg-teal-50 w-fit px-2 py-0.5 rounded">1 Use Per Customer</span>
                                                    ) : (
                                                        <span>Unlimited Uses</span>
                                                    )}
                                                    {node.discount.usageLimit && (
                                                        <span>Max {node.discount.usageLimit} total uses</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleDelete(node.id, code)}
                                                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Delete Discount"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ─── MARQUEE BANNER MANAGER ─── */}
            <MarqueeBannerManager />
        </>
    );
}

// ────────────────────────────────────
// Marquee Banner Manager Sub-Component
// ────────────────────────────────────
interface MarqueeItem {
    id: string;
    handle: string;
    text: string;
}

function MarqueeBannerManager() {
    const [items, setItems] = useState<MarqueeItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [newText, setNewText] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState("");
    const [seeding, setSeeding] = useState(false);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/marquee");
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) setItems(data);
            }
        } catch { }
        setLoading(false);
    };

    useEffect(() => { fetchItems(); }, []);

    const handleAdd = async () => {
        if (!newText.trim()) return;
        setSubmitting(true);
        try {
            const res = await adminFetch("/api/admin/marquee", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: newText.trim() })
            });
            if (res.ok) {
                setNewText("");
                setIsAdding(false);
                await fetchItems();
            } else {
                const data = await res.json().catch(() => ({}));
                alert(data.error || "Failed to add");
            }
        } catch (e: any) {
            alert(e.message);
        }
        setSubmitting(false);
    };

    const handleEdit = async (item: MarqueeItem) => {
        if (!editText.trim() || editText.trim() === item.text) {
            setEditingId(null);
            return;
        }
        setSubmitting(true);
        try {
            const res = await adminFetch("/api/admin/marquee", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: editText.trim(), handle: item.handle })
            });
            if (res.ok) {
                setEditingId(null);
                await fetchItems();
            } else {
                const data = await res.json().catch(() => ({}));
                alert(data.error || "Failed to update");
            }
        } catch (e: any) {
            alert(e.message);
        }
        setSubmitting(false);
    };

    const handleDelete = async (id: string, text: string) => {
        if (!confirm(`Remove "${text}" from the marquee?`)) return;
        try {
            const res = await adminFetch(`/api/admin/marquee?id=${encodeURIComponent(id)}`, { method: "DELETE" });
            if (res.ok) await fetchItems();
            else alert("Failed to delete");
        } catch (e: any) { alert(e.message); }
    };

    const seedDefaults = async () => {
        const defaults = ["PREMIUM COTTON", "MADE IN INDIA", "FREE SHIPPING ABOVE ₹999", "EASY RETURNS"];
        setSeeding(true);
        for (const text of defaults) {
            try {
                await adminFetch("/api/admin/marquee", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text })
                });
            } catch { }
        }
        await fetchItems();
        setSeeding(false);
    };

    return (
        <div className="bg-white p-8 md:p-10 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 rounded-sm mt-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-prata text-slate-900">Announcement Marquee</h2>
                    <p className="text-sm font-figtree text-slate-500 mt-1">Scrolling text bar below the homepage hero. Synced with Shopify metaobjects.</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 bg-[#0E4D55] text-white px-5 py-2.5 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-[#0A3A40] transition-colors"
                >
                    {isAdding ? "Cancel" : <><Plus size={16} /> Add Text</>}
                </button>
            </div>

            {/* Live Preview */}
            <div className="mb-6 rounded-lg overflow-hidden border border-[#0E4D55]/10">
                <p className="text-[9px] uppercase tracking-widest font-bold text-slate-400 px-3 py-2 bg-slate-50/50">Live Preview</p>
                <div className="bg-[#0E4D55] py-2.5 overflow-hidden whitespace-nowrap">
                    <div className="inline-flex animate-marquee-scroll">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <span key={i} className="text-[11px] font-figtree font-medium tracking-[0.25em] text-white/90 px-1 shrink-0">
                                {(items.length > 0 ? items.map((it: MarqueeItem) => it.text.toUpperCase()) : ["PREMIUM COTTON", "MADE IN INDIA", "FREE SHIPPING"]).join("  ◆  ") + "  ◆  "}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Add New */}
            {isAdding && (
                <div className="bg-[#FDFBF7] p-5 rounded-xl border border-[#006D77]/10 mb-6 flex items-end gap-4 animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className="flex-1 space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#0E4D55]">Marquee Text <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={newText}
                            onChange={(e) => setNewText(e.target.value)}
                            placeholder="e.g. FLAT 20% OFF ON ALL KURTAS"
                            className="w-full bg-white border border-gray-200 focus:border-[#0E4D55] focus:ring-1 focus:ring-[#0E4D55] rounded-xl px-4 py-3 text-sm font-medium text-slate-900 uppercase transition-all"
                        />
                    </div>
                    <button
                        onClick={handleAdd}
                        disabled={submitting || !newText.trim()}
                        className="bg-[#0E4D55] text-white px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-[#0A3A40] transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0"
                    >
                        {submitting && <Loader2 size={14} className="animate-spin" />}
                        {submitting ? "Saving..." : "Add"}
                    </button>
                </div>
            )}

            {/* Items List */}
            {loading ? (
                <div className="flex items-center justify-center py-12 text-[#006D77]">
                    <Loader2 className="animate-spin w-6 h-6" />
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-2xl space-y-4">
                    <p className="text-sm text-slate-500 font-figtree">No marquee texts in Shopify yet. Default text is being used.</p>
                    <button
                        onClick={seedDefaults}
                        disabled={seeding}
                        className="inline-flex items-center gap-2 bg-[#0E4D55] text-white px-5 py-2.5 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-[#0A3A40] transition-colors disabled:opacity-50"
                    >
                        {seeding && <Loader2 size={14} className="animate-spin" />}
                        {seeding ? "Creating..." : "Load Default Texts"}
                    </button>
                    <p className="text-[10px] text-slate-400">This will create the default texts as editable items in Shopify.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {items.map((item: MarqueeItem) => (
                        <div key={item.id} className="flex items-center justify-between bg-slate-50/50 rounded-lg px-5 py-3 group hover:bg-slate-50 transition-colors">
                            {editingId === item.id ? (
                                <div className="flex items-center gap-3 flex-1 mr-4">
                                    <span className="text-[#0E4D55] text-xs">◆</span>
                                    <input
                                        type="text"
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === "Enter") handleEdit(item); if (e.key === "Escape") setEditingId(null); }}
                                        className="flex-1 bg-white border border-[#0E4D55]/30 focus:border-[#0E4D55] focus:ring-1 focus:ring-[#0E4D55] rounded-lg px-3 py-1.5 text-sm font-medium text-slate-900 uppercase transition-all"
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => handleEdit(item)}
                                        disabled={submitting}
                                        className="text-xs font-bold text-[#0E4D55] hover:underline disabled:opacity-50"
                                    >
                                        {submitting ? "..." : "Save"}
                                    </button>
                                    <button
                                        onClick={() => setEditingId(null)}
                                        className="text-xs text-slate-400 hover:text-slate-600"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <div
                                    className="flex items-center gap-3 flex-1 cursor-pointer"
                                    onClick={() => { setEditingId(item.id); setEditText(item.text); }}
                                    title="Click to edit"
                                >
                                    <span className="text-[#0E4D55] text-xs">◆</span>
                                    <span className="text-sm font-medium text-slate-800 uppercase tracking-wider">{item.text}</span>
                                    <span className="text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity ml-1">click to edit</span>
                                </div>
                            )}
                            <button
                                onClick={() => handleDelete(item.id, item.text)}
                                className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                                title="Remove"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

