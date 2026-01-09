"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

interface Lead {
    id: string;
    name: string;
    email: string;
    phone: string;
    requirementType: string;
    requirement: string;
    state: string;
    city: string;
    address: string;
    description: string;
    product_title: string;
    product_handle: string;
    date: string;
}

// Helper to get requirement type label and styling
const getRequirementTypeInfo = (type: string) => {
    switch (type) {
        case "retail":
            return { label: "Retail Shop", icon: "🏪", color: "bg-blue-50 text-blue-700 border-blue-200" };
        case "wholesale":
            return { label: "Wholesale (B2B)", icon: "🏭", color: "bg-purple-50 text-purple-700 border-purple-200" };
        case "online":
            return { label: "Online Portal", icon: "🌐", color: "bg-green-50 text-green-700 border-green-200" };
        default:
            return { label: type || "N/A", icon: "📦", color: "bg-slate-50 text-slate-700 border-slate-200" };
    }
};

export default function WholesaleLeadsTable() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

    const fetchLeads = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/wholesale");
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setLeads(data.leads || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    if (loading && leads.length === 0) return (
        <div className="flex justify-center p-12">
            <Loader2 className="animate-spin text-[#0E4D55]" size={32} />
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-800 text-lg font-lora">All Inquiries</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#0E4D55]/10 text-[#0E4D55] text-xs font-bold">
                        {leads.length}
                    </span>
                </div>
                <button
                    onClick={fetchLeads}
                    className="p-2.5 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-[#0E4D55]"
                    title="Refresh List"
                >
                    <RefreshCw size={18} />
                </button>
            </div>

            {error ? (
                <div className="bg-red-50 border border-red-100 p-8 rounded-xl text-center text-red-600">
                    <p className="font-medium">Failed to load leads</p>
                    <p className="text-sm mt-1 opacity-80">{error}</p>
                </div>
            ) : leads.length === 0 ? (
                <div className="bg-white border border-dashed border-slate-300 p-12 rounded-xl text-center text-slate-500">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <div className="w-6 h-6 border-2 border-slate-300 rounded-full" />
                    </div>
                    <p>No inquiries found yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {leads.map((lead) => (
                        <div
                            key={lead.id}
                            onClick={() => setSelectedLead(lead)}
                            className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col gap-4 group cursor-pointer hover:border-[#0E4D55]/50 active:scale-[0.99]"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-slate-900 line-clamp-1">{lead.name}</h4>
                                    <p className="text-sm text-slate-500">{new Date(lead.date).toLocaleDateString()}</p>
                                </div>
                                {lead.requirementType && (
                                    <div className={`px-2 py-1 rounded text-xs font-bold border flex items-center gap-1 ${getRequirementTypeInfo(lead.requirementType).color}`}>
                                        <span>{getRequirementTypeInfo(lead.requirementType).icon}</span>
                                        <span>{getRequirementTypeInfo(lead.requirementType).label}</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">@</span>
                                    <span className="truncate">{lead.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600">
                                    <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">#</span>
                                    <span>{lead.phone}</span>
                                </div>
                                {(lead.city || lead.state) && (
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">📍</span>
                                        <span className="truncate">{[lead.city, lead.state].filter(Boolean).join(", ")}</span>
                                    </div>
                                )}
                            </div>

                            <div className="bg-slate-50 px-3 py-2.5 rounded-lg text-sm border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Product Interest</p>
                                <p className="font-medium text-[#0E4D55] line-clamp-1">{lead.product_title}</p>
                            </div>

                            {(lead.requirement || lead.description || lead.address) && (
                                <div className="pt-2 border-t border-slate-100 mt-auto space-y-1">
                                    {lead.requirement && (
                                        <p className="text-xs text-slate-500">
                                            <span className="font-semibold text-slate-700">Qty: </span>
                                            {lead.requirement}
                                        </p>
                                    )}
                                    {lead.description && (
                                        <p className="text-xs text-slate-500 line-clamp-2">
                                            <span className="font-semibold text-slate-700">Note: </span>
                                            {lead.description}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            {selectedLead && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto outline-none animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
                            <div>
                                <h2 className="text-xl font-bold font-lora text-slate-900">{selectedLead.name}</h2>
                                <p className="text-sm text-slate-500">Inquiry Date: {new Date(selectedLead.date).toLocaleString()}</p>
                            </div>
                            <button
                                onClick={() => setSelectedLead(null)}
                                className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-8">
                            {/* Key Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Product Section */}
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Interested Product</label>
                                    <div className="space-y-1">
                                        <p className="font-medium text-[#0E4D55] text-lg leading-tight">{selectedLead.product_title}</p>
                                        <p className="text-xs text-slate-500 font-mono">{selectedLead.product_handle}</p>
                                        {selectedLead.requirement && (
                                            <div className="mt-3 inline-block bg-white px-3 py-1 rounded border border-slate-200 text-sm font-medium text-slate-700 shadow-sm">
                                                Qty: {selectedLead.requirement}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Contact Section */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Contact Info</label>
                                        <div className="space-y-2">
                                            <a href={`mailto:${selectedLead.email}`} className="flex items-center gap-2 text-slate-700 hover:text-[#0E4D55] transition-colors p-2 hover:bg-slate-50 rounded-lg -ml-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">@</div>
                                                <span className="font-medium">{selectedLead.email}</span>
                                            </a>
                                            <a href={`tel:${selectedLead.phone}`} className="flex items-center gap-2 text-slate-700 hover:text-[#0E4D55] transition-colors p-2 hover:bg-slate-50 rounded-lg -ml-2">
                                                <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center">#</div>
                                                <span className="font-medium">{selectedLead.phone}</span>
                                            </a>
                                        </div>
                                    </div>

                                    {selectedLead.requirementType && (
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Business Type</label>
                                            <div className={`px-3 py-2 rounded-lg text-sm font-bold border flex items-center gap-2 w-fit ${getRequirementTypeInfo(selectedLead.requirementType).color}`}>
                                                <span className="text-lg">{getRequirementTypeInfo(selectedLead.requirementType).icon}</span>
                                                <span>{getRequirementTypeInfo(selectedLead.requirementType).label}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Location & Address */}
                            {(selectedLead.address || selectedLead.city || selectedLead.state) && (
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3">
                                        <span>📍 Location Details</span>
                                    </label>
                                    <div className="bg-gray-50 rounded-xl p-4 text-sm text-slate-700 border border-gray-200">
                                        <p className="font-medium mb-1">
                                            {[selectedLead.city, selectedLead.state].filter(Boolean).join(", ")}
                                        </p>
                                        {selectedLead.address && (
                                            <p className="text-slate-500 mt-2 whitespace-pre-wrap">{selectedLead.address}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Full Message/Description */}
                            {selectedLead.description && (
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3">
                                        <span>📝 Additional Notes</span>
                                    </label>
                                    <div className="bg-[#FFFBF0] rounded-xl p-5 text-sm text-slate-800 border border-amber-100 leading-relaxed whitespace-pre-wrap">
                                        {selectedLead.description}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex justify-end">
                            <button
                                onClick={() => setSelectedLead(null)}
                                className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-slate-700 font-medium rounded-lg transition-colors shadow-sm"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
