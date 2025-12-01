'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface Toast {
    id: string;
    type: 'success' | 'error';
    title: string;
    message: string;
}

export default function ToastNotification() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        const handleProductCreated = (event: Event) => {
            const customEvent = event as CustomEvent;
            const { title } = customEvent.detail;

            const newToast: Toast = {
                id: Date.now().toString(),
                type: 'success',
                title: 'Product Created',
                message: `"${title}" has been created successfully!`,
            };

            setToasts((prev) => [...prev, newToast]);

            // Auto-remove after 5 seconds
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
            }, 5000);
        };

        const handleProductError = (event: Event) => {
            const customEvent = event as CustomEvent;
            const { title, error } = customEvent.detail;

            const newToast: Toast = {
                id: Date.now().toString(),
                type: 'error',
                title: 'Creation Failed',
                message: `Failed to create "${title}": ${error}`,
            };

            setToasts((prev) => [...prev, newToast]);

            // Auto-remove after 7 seconds for errors
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
            }, 7000);
        };

        window.addEventListener('product-created', handleProductCreated);
        window.addEventListener('product-creation-error', handleProductError);

        return () => {
            window.removeEventListener('product-created', handleProductCreated);
            window.removeEventListener('product-creation-error', handleProductError);
        };
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.9 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className={`p-4 rounded-lg shadow-xl backdrop-blur-sm flex items-start gap-3 ${toast.type === 'success'
                                ? 'bg-green-50 border-l-4 border-green-500'
                                : 'bg-red-50 border-l-4 border-red-500'
                            }`}
                    >
                        {toast.type === 'success' ? (
                            <CheckCircle size={24} className="text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                            <XCircle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
                        )}

                        <div className="flex-1 min-w-0">
                            <h4 className={`font-semibold text-sm ${toast.type === 'success' ? 'text-green-900' : 'text-red-900'
                                }`}>
                                {toast.title}
                            </h4>
                            <p className={`text-xs mt-1 ${toast.type === 'success' ? 'text-green-700' : 'text-red-700'
                                }`}>
                                {toast.message}
                            </p>
                        </div>

                        <button
                            onClick={() => removeToast(toast.id)}
                            className={`flex-shrink-0 p-1 rounded hover:bg-white/50 transition-colors ${toast.type === 'success' ? 'text-green-600' : 'text-red-600'
                                }`}
                        >
                            <X size={16} />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
