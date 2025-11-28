"use client";

import { Search, ShoppingBag, Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MENU_DATA } from "@/lib/menuData";

import MobileMenu from "@/components/MobileMenu";

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    const hoverLineClass =
        "relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-full after:bg-[#006D77] after:origin-bottom-right after:scale-x-0 hover:after:origin-bottom-left hover:after:scale-x-100 after:transition-transform after:duration-300 after:ease-out";

    const containerVariants = {
        hidden: { opacity: 0, y: -10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.2,
                staggerChildren: 0.1,
            },
        },
        exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    };

    const activeMenuItem = MENU_DATA.find((item) => item.id === activeMenuId);

    return (
        <>
            <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

            {/* Dimming Backdrop */}
            <AnimatePresence>
                {activeMenuId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 bg-black/20 z-40"
                        onMouseEnter={() => setActiveMenuId(null)}
                    />
                )}
            </AnimatePresence>

            <nav className="sticky top-0 left-0 right-0 z-50 bg-[#FDFBF7] text-slate-900 border-b border-gray-100/50">
                <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between relative">
                    {/* Mobile Left: Menu + Search */}
                    <div className="flex md:hidden items-center gap-4">
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="p-1 -ml-1"
                        >
                            <Menu size={24} />
                        </button>
                        <button>
                            <Search size={20} />
                        </button>
                    </div>

                    {/* Desktop Left: Links */}
                    <div className="hidden md:flex items-center gap-8">
                        {MENU_DATA.map((item) => (
                            <div
                                key={item.id}
                                onMouseEnter={() => {
                                    if (item.shopify_layout_type) {
                                        setActiveMenuId(item.id);
                                    } else {
                                        setActiveMenuId(null);
                                    }
                                }}
                                className="h-full flex items-center"
                            >
                                <Link
                                    href={item.href}
                                    className={`text-sm font-figtree font-medium tracking-wide ${hoverLineClass}`}
                                >
                                    {item.label}
                                </Link>
                            </div>
                        ))}
                    </div>

                    {/* Center: Logo */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <Link href="/" className="text-2xl md:text-3xl font-lora font-bold">
                            Kevara
                        </Link>
                    </div>

                    {/* Right: Icons */}
                    <div className="flex items-center gap-6">
                        <button className="hidden md:block hover:opacity-70 transition-opacity">
                            <Search size={20} />
                        </button>
                        <button className="hover:opacity-70 transition-opacity relative">
                            <ShoppingBag size={20} />
                            <span className="absolute -top-1 -right-1 bg-slate-900 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                                0
                            </span>
                        </button>
                    </div>
                </div>

                {/* Mega Menu - Centered Container */}
                <AnimatePresence>
                    {activeMenuItem && activeMenuItem.shopify_layout_type && (
                        <motion.div
                            key={activeMenuItem.id}
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            onMouseEnter={() => setActiveMenuId(activeMenuItem.id)}
                            onMouseLeave={() => setActiveMenuId(null)}
                            className="absolute top-full left-0 right-0 bg-white shadow-sm border-t border-gray-100 z-50"
                        >
                            <div className="max-w-7xl mx-auto px-8 py-12">
                                {/* MIXED LAYOUT (Women / Men) */}
                                {activeMenuItem.shopify_layout_type === "mixed" && (
                                    <div className="grid grid-cols-12 gap-8">
                                        {/* Left: Links (Span 4) */}
                                        <div className="col-span-4 grid grid-cols-3 gap-8">
                                            {activeMenuItem.columns?.map((col, idx) => (
                                                <motion.div key={idx} variants={itemVariants}>
                                                    <h3 className="font-lora text-lg mb-4">
                                                        {col.title}
                                                    </h3>
                                                    <ul className="space-y-3">
                                                        {col.links.map((link) => (
                                                            <li key={link.label}>
                                                                <Link
                                                                    href={link.href}
                                                                    className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                                                                >
                                                                    {link.label}
                                                                </Link>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </motion.div>
                                            ))}
                                        </div>

                                        {/* Right: Images (Span 8) */}
                                        <div className="col-span-8 grid grid-cols-3 gap-6">
                                            {activeMenuItem.images?.map((img, idx) => (
                                                <motion.div key={idx} variants={itemVariants}>
                                                    <Link
                                                        href={img.href}
                                                        className="group block"
                                                    >
                                                        <div className="relative h-80 w-full overflow-hidden bg-gray-100 mb-3">
                                                            <Image
                                                                src={img.src}
                                                                alt={img.label}
                                                                fill
                                                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                                            />
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                                                        </div>
                                                        <div className="text-center">
                                                            <span className="font-lora text-base text-slate-900 tracking-wide uppercase">
                                                                {img.label}
                                                            </span>
                                                        </div>
                                                    </Link>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* VISUAL LAYOUT (About) */}
                                {activeMenuItem.shopify_layout_type === "visual" && (
                                    <div className="grid grid-cols-3 gap-8">
                                        {activeMenuItem.images?.map((img, idx) => (
                                            <motion.div key={idx} variants={itemVariants}>
                                                <Link href={img.href} className="group block text-center">
                                                    <div className="relative h-80 w-full overflow-hidden mb-4">
                                                        <Image
                                                            src={img.src}
                                                            alt={img.label}
                                                            fill
                                                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                                                        />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                                                    </div>
                                                    <h3 className="text-xl font-lora text-slate-900 group-hover:underline underline-offset-4 decoration-1">
                                                        {img.label}
                                                    </h3>
                                                </Link>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>
        </>
    );
}
