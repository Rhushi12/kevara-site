"use client";

import { motion } from "framer-motion";
import { MapPin, Package, Truck, CheckCircle, Clock } from "lucide-react";

export interface ScanDetail {
    ScanDateTime: string;
    ScanType: string;
    Scan: string;
    StatusDateTime: string;
    ScannedLocation: string;
    Instructions: string;
}

export interface Scan {
    ScanDetail: ScanDetail;
}

export function TrackingTimeline({ scans }: { scans: Scan[] }) {
    if (!scans || scans.length === 0) return null;

    // Helper to format date
    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    // Helper to format time
    const formatTime = (dateString: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleTimeString("en-IN", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };

    // Pick an icon based on the scan text
    const getIcon = (scanText: string) => {
        const lower = scanText.toLowerCase();
        if (lower.includes("delivered")) return <CheckCircle size={14} className="text-white" />;
        if (lower.includes("transit") || lower.includes("dispatched") || lower.includes("way")) return <Truck size={14} className="text-white" />;
        if (lower.includes("pickup") || lower.includes("manifest") || lower.includes("packed")) return <Package size={14} className="text-white" />;
        if (lower.includes("out for delivery")) return <MapPin size={14} className="text-white" />;
        return <Clock size={14} className="text-white" />;
    };

    // Format Delhivery's raw status text
    const formatStatus = (status: string) => {
        if (!status) return "";
        const lower = status.toLowerCase();
        if (lower === "manifested") return "Packed & Ready to Ship";
        if (lower === "in transit") return "On the Way";
        return status;
    };

    // Clean up Delhivery's raw location string
    const cleanLocation = (loc: string, status: string) => {
        if (!loc) return "";
        // Hide location for initial packaging/manifest steps to avoid confusing customers
        if (status.toLowerCase() === "manifested" || status.toLowerCase() === "packed & ready to ship") return "";
        return loc.replace(/_/g, " ").replace(/\s+/g, " ").trim();
    };

    return (
        <div className="relative pl-4 sm:pl-8 pt-4 pb-4">
            {/* The vertical line */}
            <div className="absolute left-[27px] sm:left-[43px] top-6 bottom-6 w-px bg-slate-200" />

            <div className="space-y-8 relative z-10">
                {scans.map((scanItem, idx) => {
                    const detail = scanItem.ScanDetail;
                    const isLatest = idx === 0;

                    return (
                        <div key={idx} className="flex gap-4 sm:gap-6 items-start group">
                            {/* Icon Node */}
                            <div className="flex-shrink-0 mt-1 relative">
                                <motion.div 
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm z-10 relative transition-colors ${
                                        isLatest ? "bg-[#006D77] shadow-[#006D77]/20" : "bg-slate-400 group-hover:bg-slate-500"
                                    }`}
                                >
                                    {getIcon(detail.Scan)}
                                </motion.div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 bg-white p-4 rounded-xl border border-slate-100 shadow-sm group-hover:shadow-md transition-shadow">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                                    <h4 className={`text-sm font-bold uppercase tracking-widest ${isLatest ? 'text-[#006D77]' : 'text-slate-700'}`}>
                                        {formatStatus(detail.Scan)}
                                    </h4>
                                    <div className="flex items-center gap-2 text-[10px] sm:text-xs font-semibold tracking-wider text-slate-400 uppercase">
                                        <span>{formatDate(detail.ScanDateTime)}</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                                        <span>{formatTime(detail.ScanDateTime)}</span>
                                    </div>
                                </div>
                                
                                {cleanLocation(detail.ScannedLocation, detail.Scan) && (
                                    <p className="text-xs font-medium text-slate-600 flex items-center gap-1 mb-1">
                                        <MapPin size={12} className="text-slate-400" /> {cleanLocation(detail.ScannedLocation, detail.Scan)}
                                    </p>
                                )}
                                
                                {detail.Instructions && (
                                    <p className="text-sm text-slate-500 mt-2 font-lora italic leading-relaxed">
                                        {detail.Instructions}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
