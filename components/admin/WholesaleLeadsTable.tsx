"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

interface Lead {
    id: string;
    name: string;
    email: string;
    phone: string;
    requirement: string;
    address: string;
    description: string;
    product_title: string;
    date: string;
}

export default function WholesaleLeadsTable() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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
                        <div key={lead.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col gap-4 group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-slate-900 line-clamp-1">{lead.name}</h4>
                                    <p className="text-sm text-slate-500">{new Date(lead.date).toLocaleDateString()}</p>
                                </div>
                                <div className="px-2 py-1 bg-[#FDFBF7] text-[#0E4D55] rounded text-xs font-bold border border-[#F0EBE0]">
                                    Lead
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">@</span>
                                    <a href={`mailto:${lead.email}`} className="hover:text-[#0E4D55] transition-colors truncate">{lead.email}</a>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600">
                                    <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">#</span>
                                    <a href={`tel:${lead.phone}`} className="hover:text-[#0E4D55] transition-colors">{lead.phone}</a>
                                </div>
                            </div>

                            <div className="bg-slate-50 px-3 py-2.5 rounded-lg text-sm border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Product Interest</p>
                                <p className="font-medium text-[#0E4D55] line-clamp-1">{lead.product_title}</p>
                            </div>

                            {(lead.requirement || lead.description) && (
                                <div className="pt-2 border-t border-slate-100 mt-auto">
                                    <p className="text-xs text-slate-500 line-clamp-2">
                                        <span className="font-semibold text-slate-700">Note: </span>
                                        {lead.requirement} {lead.description}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
