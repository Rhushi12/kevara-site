"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { X, Plus, Minus, User, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { MENU_DATA } from "@/lib/menuData";

interface MenuLink {
    label: string;
    href: string;
}

interface MenuColumn {
    title: string;
    items: MenuLink[];
}

interface MenuImage {
    label: string;
    href: string;
    src: string;
}

interface MenuItem {
    id: string;
    label: string;
    href: string;
    shopify_layout_type?: string;
    columns?: MenuColumn[];
    images?: MenuImage[];
}

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    menuItems: MenuItem[];
}

export default function MobileMenu({ isOpen, onClose, menuItems }: MobileMenuProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const sidebarVariants: Variants = {
        closed: { x: "-100%" },
        open: {
            x: "0%",
            transition: {
                type: "tween",
                ease: [0.4, 0, 0.2, 1],
                duration: 0.5,
            },
        },
    };

    const containerVariants: Variants = {
        closed: {},
        open: {
            transition: {
                staggerChildren: 0.05,
                delayChildren: 0.2,
            },
        },
    };

    const itemVariants: Variants = {
        closed: { opacity: 0, x: -20 },
        open: { opacity: 1, x: 0 },
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                    />

                    {/* Sidebar Panel */}
                    <motion.div
                        variants={sidebarVariants}
                        initial="closed"
                        animate="open"
                        exit="closed"
                        className="fixed inset-y-0 left-0 w-[85vw] max-w-[400px] bg-white z-[70] flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <button onClick={onClose} className="p-2 -ml-2 hover:bg-gray-50 rounded-full">
                                <X size={24} className="text-slate-900" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto">
                            <motion.div
                                variants={containerVariants}
                                initial="closed"
                                animate="open"
                                className="py-4"
                            >
                                {menuItems.map((item) => (
                                    <motion.div key={item.id} variants={itemVariants} className="border-b border-gray-50 last:border-none">
                                        <div className="px-6 py-4">
                                            <div
                                                className="flex items-center justify-between cursor-pointer"
                                                onClick={() => toggleExpand(item.id)}
                                            >
                                                <span className="text-xl font-lora text-slate-900">
                                                    {item.label}
                                                </span>
                                                {item.shopify_layout_type ? (
                                                    <button className="text-slate-900">
                                                        {expandedId === item.id ? <Minus size={20} /> : <Plus size={20} />}
                                                    </button>
                                                ) : null}
                                            </div>

                                            {/* Expanded Content */}
                                            <AnimatePresence>
                                                {expandedId === item.id && item.shopify_layout_type && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="pt-4 pb-2 space-y-6">
                                                            {/* Sub-categories (Columns) */}
                                                            {item.columns?.map((col, idx) => (
                                                                <div key={idx} className="space-y-3">
                                                                    <h4 className="text-xs font-bold tracking-widest uppercase text-gray-400">
                                                                        {col.title}
                                                                    </h4>
                                                                    <ul className="space-y-3 pl-2 border-l border-gray-100">
                                                                        {col.items.map((link) => (
                                                                            <li key={link.label}>
                                                                                <Link
                                                                                    href={link.href}
                                                                                    onClick={onClose}
                                                                                    className="block text-sm text-slate-600 hover:text-slate-900"
                                                                                >
                                                                                    {link.label}
                                                                                </Link>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            ))}

                                                            {/* Images Carousel */}
                                                            {item.images && (
                                                                <div className="mt-6 -mx-6">
                                                                    <div className="flex gap-3 overflow-x-auto px-6 snap-x snap-mandatory scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] touch-pan-y">
                                                                        {item.images.map((img, idx) => (
                                                                            <Link
                                                                                key={idx}
                                                                                href={img.href}
                                                                                onClick={onClose}
                                                                                className="group block flex-shrink-0 snap-start"
                                                                            >
                                                                                <div className="relative w-32 h-40 overflow-hidden bg-gray-100 rounded mb-2">
                                                                                    <Image
                                                                                        src={img.src}
                                                                                        alt={img.label}
                                                                                        fill
                                                                                        className="object-cover"
                                                                                        sizes="128px"
                                                                                    />
                                                                                </div>
                                                                                <span className="text-[10px] font-bold tracking-widest uppercase text-slate-900">
                                                                                    {img.label}
                                                                                </span>
                                                                            </Link>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50">
                            <Link
                                href="/account"
                                onClick={onClose}
                                className="flex items-center gap-3 text-slate-900 hover:text-slate-700 transition-colors"
                            >
                                <User size={20} />
                                <span className="font-figtree font-medium">Account</span>
                            </Link>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
