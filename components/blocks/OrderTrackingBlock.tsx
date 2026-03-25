"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export function OrderTrackingBlock({ order }: { order: any }) {
    const router = useRouter();
    if (!order) return null;

    const steps = [
        { key: "placed", label: "Order Placed" },
        { key: "processing", label: "Processing" },
        { key: "shipped", label: "Shipped" },
        { key: "delivered", label: "Delivered" },
    ];

    let currentStepIndex = 0;
    const status = order.fulfillmentStatus?.toUpperCase();
    if (status === "FULFILLED") currentStepIndex = 3;
    else if (status === "PARTIAL") currentStepIndex = 2;
    else if (status === "UNFULFILLED" || status === "PENDING") currentStepIndex = 1;

    const handleTrack = () => {
        const url = order.tracking?.[0]?.url;
        if (url) {
            window.open(url, '_blank');
        } else {
            window.location.href = '/track';
        }
    };

    return (
        <div className="bg-white shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100 p-8 md:p-10 flex flex-col rounded-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 pb-6 border-b border-black/5 gap-6">
                <div>
                    <h2 className="text-2xl font-prata text-slate-900 tracking-tight">Active Order</h2>
                    <p className="font-lora italic text-slate-500 mt-1" aria-label={`Tracking for Order ${order.orderNumber}`}>
                        No. {order.orderNumber} • ETA Pending
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <button
                        onClick={handleTrack}
                        className="px-8 py-3 bg-[#006D77] text-[#FDFBF7] text-xs font-bold uppercase tracking-widest hover:bg-[#004e55] transition-colors whitespace-nowrap"
                    >
                        Track Parcel
                    </button>
                    <button
                        onClick={() => router.push('/account/orders')}
                        className="px-8 py-3 bg-white text-slate-900 border border-slate-200 text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-colors whitespace-nowrap"
                    >
                        View History
                    </button>
                </div>
            </div>

            <div className="relative pt-6 pb-4" role="progressbar" aria-valuenow={currentStepIndex} aria-valuemin={0} aria-valuemax={3}>
                <div className="absolute top-[28px] left-0 right-0 h-[1px] bg-slate-200 mx-[10%]">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                        className="h-full bg-[#006D77]"
                    />
                </div>
                
                <div className="relative flex justify-between px-4 sm:px-[10%]">
                    {steps.map((step, idx) => {
                        const isCompleted = idx <= currentStepIndex;
                        const isCurrent = idx === currentStepIndex;
                        
                        return (
                            <div key={step.key} className="flex flex-col items-center gap-4 relative z-10 w-24" aria-current={isCurrent ? "step" : undefined}>
                                <motion.div 
                                    className={`w-3 h-3 rounded-full transition-colors duration-500 border-2 border-white ring-2 ${
                                        isCompleted ? 'bg-[#006D77] ring-[#006D77]/20 border-white' : 'bg-slate-200 ring-transparent border-white'
                                    }`}
                                    aria-label={step.label}
                                />
                                <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest text-center ${isCurrent ? 'text-[#006D77]' : 'text-slate-400'}`}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
