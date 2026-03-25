"use client";

import { useState, useEffect, useCallback } from "react";
import { Truck, PackageX, RefreshCw, ExternalLink, ShieldCheck, MapPin, AlertCircle, Plus } from "lucide-react";
import { ShipmentRecord } from "@/lib/delhivery";
import { adminFetch } from "@/lib/admin-fetch";

export default function LogisticsDashboard() {
    const [activeTab, setActiveTab] = useState<"orders" | "returns">("orders");
    const [isSyncing, setIsSyncing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [outbound, setOutbound] = useState<ShipmentRecord[]>([]);
    const [returns, setReturns] = useState<ShipmentRecord[]>([]);
    const [apiConfigured, setApiConfigured] = useState(false);

    const fetchShipments = useCallback(async () => {
        setIsLoading(true);
        try {
            const [outRes, retRes] = await Promise.all([
                adminFetch("/api/admin/shipments?type=outbound"),
                adminFetch("/api/admin/shipments?type=return"),
            ]);
            const outData = await outRes.json();
            const retData = await retRes.json();
            setOutbound(outData.shipments || []);
            setReturns(retData.shipments || []);
        } catch (err) {
            console.error("[Logistics] Fetch error:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchShipments();
        // Check if Delhivery API is configured
        fetch("/api/webhooks/delhivery")
            .then(res => res.json())
            .then(data => setApiConfigured(data.configured || false))
            .catch(() => setApiConfigured(false));
    }, [fetchShipments]);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            // Re-fetch all data
            await fetchShipments();
        } catch (err) {
            console.error("[Logistics] Sync error:", err);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleTrack = async (awb: string) => {
        try {
            const res = await adminFetch(`/api/admin/shipments/track?awb=${awb}`);
            const data = await res.json();
            if (data.error) {
                alert(`Tracking Error: ${data.error}`);
            } else {
                alert(`AWB: ${awb}\nStatus: ${data.status}\nLocation: ${data.location}\nSource: ${data.source === "delhivery_api" ? "Live Delhivery API" : "Cached Database"}`);
                // Refresh the list to show any updated statuses
                await fetchShipments();
            }
        } catch (err) {
            console.error("[Track] Error:", err);
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
        } catch {
            return dateStr || "—";
        }
    };

    const getStatusStyle = (status: string) => {
        if (status === "Delivered") return "border-emerald-200 text-emerald-700 bg-emerald-50";
        if (status === "Out for Delivery") return "border-amber-200 text-amber-700 bg-amber-50";
        if (status.includes("RTO") || status === "Cancelled" || status === "Lost") return "border-rose-200 text-rose-700 bg-rose-50";
        return "border-[#006D77]/20 text-[#006D77] bg-[#006D77]/5";
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-8 border-b border-black/5 gap-4">
                <div>
                    <h1 className="text-4xl font-prata text-slate-900 tracking-tight mb-2">Delhivery Operations</h1>
                    <p className="font-lora italic text-slate-500 text-lg">Live shipping logistics, AWB tracking, and RTO management.</p>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="text-[10px] uppercase tracking-widest font-bold text-[#006D77] border border-[#006D77]/20 bg-white px-6 py-3 flex items-center gap-3 hover:bg-[#FDFBF7] transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
                        {isSyncing ? "Syncing..." : "Refresh Data"}
                    </button>
                </div>
            </div>

            {/* API Status Banner */}
            {!apiConfigured && (
                <div className="p-4 bg-amber-50 border border-amber-200 flex items-start gap-3">
                    <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-1">Delhivery API Not Configured</p>
                        <p className="font-lora italic text-xs text-amber-600">Add <code className="font-mono bg-amber-100 px-1">DELHIVERY_API_TOKEN</code> to your <code className="font-mono bg-amber-100 px-1">.env.local</code> to enable live tracking. Currently showing database-only records.</p>
                    </div>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex border-b border-black/5 mb-8">
                <button
                    onClick={() => setActiveTab("orders")}
                    className={`pb-4 px-4 text-xs font-bold uppercase tracking-widest transition-all ${
                        activeTab === "orders" ? "border-b-2 border-[#006D77] text-[#006D77]" : "text-slate-400 hover:text-slate-900"
                    }`}
                >
                    Outbound Shipments ({outbound.length})
                </button>
                <button
                    onClick={() => setActiveTab("returns")}
                    className={`pb-4 px-4 text-xs font-bold uppercase tracking-widest transition-all ${
                        activeTab === "returns" ? "border-b-2 border-[#006D77] text-[#006D77]" : "text-slate-400 hover:text-slate-900"
                    }`}
                >
                    Returns & RTOs ({returns.length})
                </button>
            </div>

            {/* Content Area */}
            <div className="bg-white border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] rounded-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-16 flex flex-col items-center justify-center space-y-4">
                        <div className="w-8 h-8 rounded-full border-2 border-t-[#006D77] border-slate-200 animate-spin" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Loading Shipment Data...</p>
                    </div>
                ) : activeTab === "orders" ? (
                    outbound.length === 0 ? (
                        <div className="p-16 text-center">
                            <Truck size={32} className="mx-auto text-slate-200 mb-4" />
                            <p className="font-prata text-xl text-slate-900 mb-2">No Outbound Shipments</p>
                            <p className="font-lora italic text-slate-500 text-sm">Shipments will appear here when orders are dispatched via Delhivery.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/50">
                                        <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">Order & AWB</th>
                                        <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">Customer</th>
                                        <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                                        <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">Last Scan</th>
                                        <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {outbound.map((shipment) => (
                                        <tr key={shipment.id} className="border-b border-slate-50 hover:bg-[#FDFBF7] transition-colors group">
                                            <td className="py-5 px-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-prata text-slate-900">{shipment.orderId}</span>
                                                    <span className="font-mono text-[10px] text-slate-400 flex items-center gap-1">
                                                        <Truck size={10} /> {shipment.awb}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6">
                                                <span className="text-sm font-semibold text-slate-700">{shipment.customer.name}</span>
                                            </td>
                                            <td className="py-5 px-6">
                                                <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 border ${getStatusStyle(shipment.status)}`}>
                                                    {shipment.status}
                                                </span>
                                            </td>
                                            <td className="py-5 px-6 w-[300px]">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs text-slate-600 flex items-center gap-2">
                                                        <MapPin size={12} className="text-[#006D77]" /> {shipment.lastScan.location}
                                                    </span>
                                                    <span className="font-lora italic text-[10px] text-slate-400">ETA: {shipment.eta}</span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 text-right">
                                                <button 
                                                    onClick={() => handleTrack(shipment.awb)}
                                                    className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-[#006D77] transition-colors inline-flex items-center gap-1 opacity-0 group-hover:opacity-100"
                                                >
                                                    Track <ExternalLink size={10} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                ) : (
                    returns.length === 0 ? (
                        <div className="p-16 text-center">
                            <PackageX size={32} className="mx-auto text-slate-200 mb-4" />
                            <p className="font-prata text-xl text-slate-900 mb-2">No Returns or RTOs</p>
                            <p className="font-lora italic text-slate-500 text-sm">Return shipments and RTO records will appear here when initiated.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/50">
                                        <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">Return AWB</th>
                                        <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">Customer & Reason</th>
                                        <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                                        <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">Last Scan</th>
                                        <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {returns.map((ret) => (
                                        <tr key={ret.id} className="border-b border-slate-50 hover:bg-[#FDFBF7] transition-colors group">
                                            <td className="py-5 px-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-prata text-slate-900">{ret.orderId}</span>
                                                    <span className="font-mono text-[10px] text-rose-500 flex items-center gap-1">
                                                        <PackageX size={10} /> {ret.awb}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 w-[250px]">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-semibold text-slate-700">{ret.customer.name}</span>
                                                    {ret.returnReason && (
                                                        <span className="font-lora italic text-[11px] text-slate-500">"{ret.returnReason}"</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-5 px-6">
                                                <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 border border-rose-200 text-rose-700 bg-rose-50">
                                                    {ret.status}
                                                </span>
                                            </td>
                                            <td className="py-5 px-6 w-[300px]">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs text-slate-600 flex items-center gap-2">
                                                        <MapPin size={12} className="text-rose-500" /> {ret.lastScan.location}
                                                    </span>
                                                    <span className="font-lora italic text-[10px] text-slate-400">Initiated: {formatDate(ret.createdAt)}</span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 text-right">
                                                <button
                                                    onClick={() => handleTrack(ret.awb)}
                                                    className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-rose-600 transition-colors inline-flex items-center gap-1 opacity-0 group-hover:opacity-100"
                                                >
                                                    Inspect <ShieldCheck size={10} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </div>

            <div className="mt-8 p-6 border border-dashed border-[#006D77]/30 bg-[#006D77]/5">
                <h4 className="font-prata text-[#006D77] text-lg mb-2">Integration Status</h4>
                <p className="font-lora italic text-slate-600 text-sm mb-4">Delhivery pushes AWB updates to the webhook endpoint in real-time. Configure the required environment variables to activate live tracking.</p>
                <div className="flex flex-wrap items-center gap-4">
                    <code className="bg-white border border-[#006D77]/20 px-4 py-2 text-xs font-mono text-slate-500">/api/webhooks/delhivery</code>
                    <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${apiConfigured ? "text-emerald-600" : "text-amber-600"}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${apiConfigured ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                        {apiConfigured ? "Webhook Active" : "Awaiting Configuration"}
                    </span>
                </div>
            </div>
        </div>
    );
}
