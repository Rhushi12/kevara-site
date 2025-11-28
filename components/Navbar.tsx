"use client";

import { Search, ShoppingBag, Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MENU_DATA } from "@/lib/menuData";
import { useAuth } from "@/context/AuthContext";
import EditableText from "@/components/admin/EditableText";
import ImageUploadModal from "@/components/admin/ImageUploadModal";

import MobileMenu from "@/components/MobileMenu";
import MenuCarousel from "./MenuCarousel";

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const { user, logout, isAdmin } = useAuth();
    const [menuData, setMenuData] = useState(MENU_DATA);

    // New State for Edit Mode and Image Upload
    const [isEditMode, setIsEditMode] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadTarget, setUploadTarget] = useState<{ menuId: string; } | null>(null);

    useEffect(() => {
        // Dynamically import to avoid server-side issues if needed, though this is a client component
        import("@/lib/db").then(({ subscribeToNavigation }) => {
            const unsubscribe = subscribeToNavigation((data) => {
                if (data && data.length > 0) {
                    setMenuData(data);
                }
            });
            return () => unsubscribe();
        });
    }, []);

    const handleUpdateMenuLabel = async (id: string, newLabel: string) => {
        const updatedMenu = menuData.map(item =>
            item.id === id ? { ...item, label: newLabel } : item
        );
        setMenuData(updatedMenu);
        const { saveNavigationMenu } = await import("@/lib/db");
        await saveNavigationMenu(updatedMenu);
    };

    const handleUpdateColumnTitle = async (menuId: string, colIdx: number, newTitle: string) => {
        const updatedMenu = menuData.map(item => {
            if (item.id === menuId && item.columns) {
                const newCols = [...item.columns];
                newCols[colIdx] = { ...newCols[colIdx], title: newTitle };
                return { ...item, columns: newCols };
            }
            return item;
        });
        setMenuData(updatedMenu);
        const { saveNavigationMenu } = await import("@/lib/db");
        await saveNavigationMenu(updatedMenu);
    };

    const handleUpdateLink = async (menuId: string, colIdx: number, linkIdx: number, newLabel: string) => {
        const updatedMenu = menuData.map(item => {
            if (item.id === menuId && item.columns) {
                const newCols = [...item.columns];
                const newItems = [...newCols[colIdx].items];
                newItems[linkIdx] = { ...newItems[linkIdx], label: newLabel };
                newCols[colIdx] = { ...newCols[colIdx], items: newItems };
                return { ...item, columns: newCols };
            }
            return item;
        });
        setMenuData(updatedMenu);
        const { saveNavigationMenu } = await import("@/lib/db");
        await saveNavigationMenu(updatedMenu);
    };

    const handleAddLink = async (menuId: string, colIdx: number) => {
        const updatedMenu = menuData.map(item => {
            if (item.id === menuId && item.columns) {
                const newCols = [...item.columns];
                const newItems = [...newCols[colIdx].items, { label: "New Link", href: "/" }];
                newCols[colIdx] = { ...newCols[colIdx], items: newItems };
                return { ...item, columns: newCols };
            }
            return item;
        });
        setMenuData(updatedMenu);
        const { saveNavigationMenu } = await import("@/lib/db");
        await saveNavigationMenu(updatedMenu);
    };

    const handleDeleteLink = async (menuId: string, colIdx: number, linkIdx: number) => {
        if (!confirm("Delete this link?")) return;
        const updatedMenu = menuData.map(item => {
            if (item.id === menuId && item.columns) {
                const newCols = [...item.columns];
                const newItems = newCols[colIdx].items.filter((_, i) => i !== linkIdx);
                newCols[colIdx] = { ...newCols[colIdx], items: newItems };
                return { ...item, columns: newCols };
            }
            return item;
        });
        setMenuData(updatedMenu);
        const { saveNavigationMenu } = await import("@/lib/db");
        await saveNavigationMenu(updatedMenu);
    };

    const handleAddColumn = async (menuId: string) => {
        const updatedMenu = menuData.map(item => {
            if (item.id === menuId) {
                const newCols = [...(item.columns || []), { title: "NEW CATEGORY", items: [] }];
                return { ...item, columns: newCols };
            }
            return item;
        });
        setMenuData(updatedMenu);
        const { saveNavigationMenu } = await import("@/lib/db");
        await saveNavigationMenu(updatedMenu);
    };

    const handleDeleteColumn = async (menuId: string, colIdx: number) => {
        if (!confirm("Delete this entire category?")) return;
        const updatedMenu = menuData.map(item => {
            if (item.id === menuId && item.columns) {
                const newCols = item.columns.filter((_, i) => i !== colIdx);
                return { ...item, columns: newCols };
            }
            return item;
        });
        setMenuData(updatedMenu);
        const { saveNavigationMenu } = await import("@/lib/db");
        await saveNavigationMenu(updatedMenu);
    };

    const handleAddImage = (menuId: string) => {
        setUploadTarget({ menuId });
        setIsUploadModalOpen(true);
    };

    const handleImageUpload = async (file: File, label: string, href: string) => {
        if (!uploadTarget) return;

        try {
            const { uploadImage, saveNavigationMenu } = await import("@/lib/db");
            const imageUrl = await uploadImage(file, `menu-images/${Date.now()}-${file.name}`);

            const updatedMenu = menuData.map(item => {
                if (item.id === uploadTarget.menuId) {
                    const newImages = [...(item.images || []), { label, src: imageUrl, href }];
                    return { ...item, images: newImages };
                }
                return item;
            });

            setMenuData(updatedMenu);
            await saveNavigationMenu(updatedMenu);
            setIsUploadModalOpen(false);
            setUploadTarget(null);
        } catch (error) {
            console.error("Failed to upload image:", error);
            alert("Failed to upload image.");
        }
    };

    const handleDeleteImage = async (menuId: string, imgIdx: number) => {
        if (!confirm("Delete this image?")) return;
        const updatedMenu = menuData.map(item => {
            if (item.id === menuId && item.images) {
                const newImages = item.images.filter((_, i) => i !== imgIdx);
                return { ...item, images: newImages };
            }
            return item;
        });
        setMenuData(updatedMenu);
        const { saveNavigationMenu } = await import("@/lib/db");
        await saveNavigationMenu(updatedMenu);
    };

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

    const activeMenuItem = menuData.find((item) => item.id === activeMenuId);

    return (
        <>
            <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
            <ImageUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUpload={handleImageUpload}
            />

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
                        {menuData.map((item) => (
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
                                {isAdmin && isEditMode ? (
                                    <EditableText
                                        value={item.label}
                                        onSave={(newVal) => handleUpdateMenuLabel(item.id, newVal)}
                                        isAdmin={true}
                                        className={`text-sm font-figtree font-medium tracking-wide ${hoverLineClass}`}
                                    />
                                ) : (
                                    <Link
                                        href={item.href}
                                        className={`text-sm font-figtree font-medium tracking-wide ${hoverLineClass}`}
                                    >
                                        {item.label}
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Center: Logo */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <Link href="/" className="block">
                            <Image
                                src="/aesthetic-logo.png"
                                alt="Kevara Logo"
                                width={150}
                                height={50}
                                className="h-12 md:h-14 w-auto object-contain"
                                priority
                            />
                        </Link>
                    </div>

                    {/* Right: Icons */}
                    <div className="flex items-center gap-6">
                        {/* Login / Account */}
                        {!user ? (
                            <Link href="/login" className="hidden md:block text-sm font-medium hover:text-[#006D77] transition-colors">
                                Login
                            </Link>
                        ) : (
                            <div className="hidden md:flex items-center gap-4">
                                <span className="text-sm text-gray-600">Hi, {user.displayName?.split(' ')[0] || 'User'}</span>
                                {isAdmin && (
                                    <div className="flex items-center gap-3">
                                        <Link href="/admin" className="text-sm font-medium text-[#006D77] hover:underline">
                                            Admin
                                        </Link>
                                        <button
                                            onClick={() => setIsEditMode(!isEditMode)}
                                            className={`text-xs px-2 py-1 rounded border transition-colors ${isEditMode
                                                    ? "bg-[#006D77] text-white border-[#006D77]"
                                                    : "bg-transparent text-gray-500 border-gray-300 hover:border-[#006D77] hover:text-[#006D77]"
                                                }`}
                                        >
                                            {isEditMode ? "Done Editing" : "Edit Menu"}
                                        </button>
                                    </div>
                                )}
                                <button onClick={() => logout()} className="text-sm font-medium hover:text-[#006D77] transition-colors">
                                    Logout
                                </button>
                            </div>
                        )}

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
                                        {/* Left: Links (Span 3 - 25%) */}
                                        <div className="col-span-3 flex flex-col gap-8 max-h-[60vh] overflow-y-auto overscroll-contain pr-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                            {activeMenuItem.columns?.map((col, colIdx) => (
                                                <motion.div key={colIdx} variants={itemVariants} className="relative group/col">
                                                    <div className="flex items-center justify-between mb-4">
                                                        {isAdmin && isEditMode ? (
                                                            <div className="flex items-center gap-2">
                                                                <EditableText
                                                                    value={col.title}
                                                                    onSave={(newVal) => handleUpdateColumnTitle(activeMenuItem.id, colIdx, newVal)}
                                                                    isAdmin={true}
                                                                    className="text-xs font-bold uppercase tracking-widest text-[#006D77]"
                                                                />
                                                                <button
                                                                    onClick={() => handleDeleteColumn(activeMenuItem.id, colIdx)}
                                                                    className="opacity-0 group-hover/col:opacity-100 text-red-500 hover:text-red-700 text-xs"
                                                                >
                                                                    <X size={12} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <h3 className="text-xs font-bold uppercase tracking-widest text-[#006D77]">
                                                                {col.title}
                                                            </h3>
                                                        )}
                                                    </div>

                                                    <ul className="space-y-2">
                                                        {col.items.map((link, linkIdx) => (
                                                            <li key={linkIdx} className="group/link flex items-center justify-between">
                                                                {isAdmin && isEditMode ? (
                                                                    <>
                                                                        <EditableText
                                                                            value={link.label}
                                                                            onSave={(newVal) => handleUpdateLink(activeMenuItem.id, colIdx, linkIdx, newVal)}
                                                                            isAdmin={true}
                                                                            className="text-sm text-slate-600 hover:text-[#006D77] transition-colors block w-full"
                                                                        />
                                                                        <button
                                                                            onClick={() => handleDeleteLink(activeMenuItem.id, colIdx, linkIdx)}
                                                                            className="opacity-0 group-hover/link:opacity-100 text-red-400 hover:text-red-600 ml-2"
                                                                        >
                                                                            <X size={10} />
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <Link
                                                                        href={link.href}
                                                                        className="text-sm text-slate-600 hover:text-[#006D77] transition-colors block"
                                                                    >
                                                                        {link.label}
                                                                    </Link>
                                                                )}
                                                            </li>
                                                        ))}
                                                        {isAdmin && isEditMode && (
                                                            <li>
                                                                <button
                                                                    onClick={() => handleAddLink(activeMenuItem.id, colIdx)}
                                                                    className="text-xs text-gray-400 hover:text-[#006D77] flex items-center gap-1 mt-2"
                                                                >
                                                                    + Add Link
                                                                </button>
                                                            </li>
                                                        )}
                                                    </ul>
                                                </motion.div>
                                            ))}
                                            {isAdmin && isEditMode && (
                                                <button
                                                    onClick={() => handleAddColumn(activeMenuItem.id)}
                                                    className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-[#006D77] border border-dashed border-gray-300 p-4 rounded text-center hover:border-[#006D77] transition-colors"
                                                >
                                                    + Add Category
                                                </button>
                                            )}
                                        </div>

                                        {/* Right: Images (Span 9 - 75%) */}
                                        <div className="col-span-9">
                                            {activeMenuItem.images && (
                                                <MenuCarousel
                                                    images={activeMenuItem.images}
                                                    isAdmin={isAdmin && isEditMode}
                                                    onDelete={(idx) => handleDeleteImage(activeMenuItem.id, idx)}
                                                    onAdd={() => handleAddImage(activeMenuItem.id)}
                                                />
                                            )}
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
