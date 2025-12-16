"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useToast, ToastType } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

const iconMap: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle size={20} className="text-emerald-500" />,
    error: <AlertCircle size={20} className="text-red-500" />,
    warning: <AlertTriangle size={20} className="text-amber-500" />,
    info: <Info size={20} className="text-blue-500" />,
};

const bgMap: Record<ToastType, string> = {
    success: "border-l-emerald-500",
    error: "border-l-red-500",
    warning: "border-l-amber-500",
    info: "border-l-blue-500",
};

export default function ToastContainer() {
    const { toasts, removeToast } = useToast();
    const { isAdmin } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Only show toasts for admins
    if (!mounted || !isAdmin) return null;

    return createPortal(
        <div className="fixed bottom-4 right-4 z-[99999] flex flex-col-reverse gap-3 pointer-events-none">
            {toasts.map((toast, index) => (
                <div
                    key={toast.id}
                    className={`
                        pointer-events-auto
                        bg-white rounded-lg shadow-xl border border-slate-200 border-l-4 ${bgMap[toast.type]}
                        px-4 py-3 min-w-[280px] max-w-[360px]
                        flex items-start gap-3
                        transform transition-all duration-300 ease-out
                    `}
                    style={{
                        animation: 'toastSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                        opacity: index > 2 ? 0 : 1,
                    }}
                >
                    <style jsx>{`
                        @keyframes toastSlideIn {
                            from {
                                opacity: 0;
                                transform: translateX(100%) scale(0.9);
                            }
                            to {
                                opacity: 1;
                                transform: translateX(0) scale(1);
                            }
                        }
                    `}</style>

                    <div className="flex-shrink-0 mt-0.5">
                        {iconMap[toast.type]}
                    </div>

                    <p className="text-sm text-slate-700 flex-1 leading-relaxed">
                        {toast.message}
                    </p>

                    <button
                        onClick={() => removeToast(toast.id)}
                        className="flex-shrink-0 p-1 hover:bg-slate-100 rounded-full transition-colors -mr-1"
                    >
                        <X size={14} className="text-slate-400" />
                    </button>
                </div>
            ))}
        </div>,
        document.body
    );
}
