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
import { useSearchStore } from "@/components/SearchPanel";

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const { user, logout, isAdmin } = useAuth();
    const [menuData, setMenuData] = useState(MENU_DATA);
    const { openSearch } = useSearchStore();

    // New State for Edit Mode and Image Upload
    const [isEditMode, setIsEditMode] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadTarget, setUploadTarget] = useState<{ menuId: string; } | null>(null);

    useEffect(() => {
        async function fetchMenu() {
            try {
                const res = await fetch('/api/navigation');
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.length > 0) {
                        setMenuData(data);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch menu:", error);
            }
        }
        fetchMenu();
    }, []);

    const saveMenuToShopify = async (updatedMenu: any[]) => {
        try {
            const res = await fetch('/api/navigation/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ menuTabs: updatedMenu }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error ? JSON.stringify(data.error) : "Failed to save menu");
            }
        } catch (error: any) {
            console.error("Failed to save menu:", error);
            alert(`Failed to save changes: ${error.message}`);
        }
    };

    const handleUpdateMenuLabel = async (id: string, newLabel: string) => {
        const updatedMenu = menuData.map(item =>
            item.id === id ? { ...item, label: newLabel } : item
        );
        setMenuData(updatedMenu);
        await saveMenuToShopify(updatedMenu);
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
        await saveMenuToShopify(updatedMenu);
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
        await saveMenuToShopify(updatedMenu);
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
        await saveMenuToShopify(updatedMenu);
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
        await saveMenuToShopify(updatedMenu);
    };

    const handleAddImage = (menuId: string) => {
        setUploadTarget({ menuId });
        setIsUploadModalOpen(true);
    };

    const handleImageUpload = async (file: File, label: string, href: string) => {
        if (!uploadTarget) return;

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();

            if (!data.success) throw new Error("Upload failed");

            const fileId = data.fileId;
            const previewUrl = URL.createObjectURL(file);
            const imageUrl = data.url || previewUrl;

            const updatedMenu = menuData.map(item => {
                if (item.id === uploadTarget.menuId) {
                    const newImages = [...(item.images || []), {
                        label,
                        src: imageUrl,
                        href,
                        imageId: fileId // Store ID for backend update
                    }];
                    return { ...item, images: newImages };
                }
                return item;
            });

            setMenuData(updatedMenu);
            await saveMenuToShopify(updatedMenu);
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
        await saveMenuToShopify(updatedMenu);
    };

    const clonePage = async (targetHandle: string, title: string) => {
        try {
            const sourceHandle = "women-new";
            const res = await fetch(`/api/pages?handle=${sourceHandle}`);
            if (!res.ok) throw new Error("Failed to fetch source page");
            const sourceData = await res.json();

            if (!sourceData || Object.keys(sourceData).length === 0) return;

            await fetch('/api/pages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    handle: targetHandle,
                    data: { ...sourceData, hero_title: title }
                }),
            });
        } catch (error) {
            console.error("Page cloning failed:", error);
        }
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
        await saveMenuToShopify(updatedMenu);
    };

    const handleUpdateLink = async (menuId: string, colIdx: number, linkIdx: number, newLabel: string) => {
        const updatedMenu = [...menuData];
        const menuItem = updatedMenu.find(item => item.id === menuId);
        if (!menuItem || !menuItem.columns) return;

        const col = menuItem.columns[colIdx];
        const link = col.items[linkIdx];

        // Auto-generate URL
        const catSlug = col.title.toLowerCase().replace(/\s+/g, "-");
        const linkSlug = newLabel.toLowerCase().replace(/\s+/g, "-");
        const newHref = `/collections/${catSlug}-${linkSlug}`;

        // Clone Page
        const handle = `${catSlug}-${linkSlug}`;
        await clonePage(handle, newLabel);

        col.items[linkIdx] = { ...link, label: newLabel, href: newHref };

        setMenuData(updatedMenu);
        await saveMenuToShopify(updatedMenu);
    };

    const handleUpdateLinkHref = async (menuId: string, colIdx: number, linkIdx: number, newHref: string) => {
        const updatedMenu = menuData.map(item => {
            if (item.id === menuId && item.columns) {
                const newCols = [...item.columns];
                const newItems = [...newCols[colIdx].items];
                newItems[linkIdx] = { ...newItems[linkIdx], href: newHref };
                newCols[colIdx] = { ...newCols[colIdx], items: newItems };
                return { ...item, columns: newCols };
            }
            return item;
        });
        setMenuData(updatedMenu);
        await saveMenuToShopify(updatedMenu);
    };

    const hoverLineClass =
        "relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-full after:bg-white after:origin-bottom-right after:scale-x-0 hover:after:origin-bottom-left hover:after:scale-x-100 after:transition-transform after:duration-300 after:ease-out";

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
            <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} menuItems={menuData} />
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
                        onMouseEnter={() => !isEditMode && setActiveMenuId(null)}
                    />
                )}
            </AnimatePresence>

            <nav className="sticky top-0 left-0 right-0 z-50 bg-[#0E4D55] text-white border-b border-white/10 transition-all duration-300">
                <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between relative">
                    {/* Mobile Left: Menu + Search */}
                    <div className="flex md:hidden items-center gap-4">
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="p-1 -ml-1"
                        >
                            <Menu size={24} />
                        </button>
                        <button onClick={openSearch}>
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
                                width={110}
                                height={37}
                                className="w-[90px] md:w-[110px] h-auto object-contain brightness-0 invert"
                                priority
                            />
                        </Link>
                    </div>

                    {/* Right: Icons */}
                    <div className="flex items-center gap-6">
                        {/* Login / Account */}
                        {!user ? (
                            <Link href="/login" className="hidden md:block text-sm font-medium hover:text-white/80 transition-colors">
                                Login
                            </Link>
                        ) : (
                            <div className="hidden md:flex items-center gap-4">
                                <span className="text-sm text-white/90">Hi, {user.displayName?.split(' ')[0] || 'User'}</span>
                                {isAdmin && (
                                    <div className="flex items-center gap-3">
                                        <Link href="/admin" className="text-sm font-medium text-white hover:underline">
                                            Admin
                                        </Link>
                                        <button
                                            onClick={() => setIsEditMode(!isEditMode)}
                                            className={`text-xs px-2 py-1 rounded border transition-colors ${isEditMode
                                                ? "bg-white text-[#006D77] border-white"
                                                : "bg-transparent text-white/80 border-white/50 hover:border-white hover:text-white"
                                                }`}
                                        >
                                            {isEditMode ? "Done Editing" : "Edit Menu"}
                                        </button>
                                    </div>
                                )}
                                <button onClick={() => logout()} className="text-sm font-medium hover:text-white/80 transition-colors">
                                    Logout
                                </button>
                            </div>
                        )}

                        <button
                            onClick={openSearch}
                            className="hidden md:block hover:opacity-70 transition-opacity"
                        >
                            <Search size={20} />
                        </button>
                        {isAdmin && (
                            <Link href="/cart" className="hover:opacity-70 transition-opacity relative">
                                <ShoppingBag size={20} />
                                <span className="absolute -top-1 -right-1 bg-white text-[#006D77] text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                                    0
                                </span>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Mega Menu - Centered Container */}
                <AnimatePresence mode="wait">
                    {activeMenuItem && activeMenuItem.shopify_layout_type && (
                        <motion.div
                            key={activeMenuItem.id}
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            onMouseEnter={() => setActiveMenuId(activeMenuItem.id)}
                            onMouseLeave={() => !isEditMode && setActiveMenuId(null)}
                            className="absolute top-full left-0 right-0 bg-white shadow-sm border-t border-gray-100 z-50"
                        >
                            <div className="max-w-7xl mx-auto h-[355px] px-12 py-[48px]">
                                {/* MIXED LAYOUT (Women / Men) */}
                                {activeMenuItem.shopify_layout_type === "mixed" && (
                                    <div className="flex h-full gap-16">
                                        {/* Left: Columns Container - Grid 3 per row with scroll */}
                                        <div
                                            className="grid grid-cols-3 gap-x-12 gap-y-6 shrink-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] content-start"
                                            style={{ width: '430px' }}
                                        >
                                            {activeMenuItem.columns?.map((col, colIdx) => (
                                                <motion.div
                                                    key={colIdx}
                                                    variants={itemVariants}
                                                    className="relative group/col"
                                                >
                                                    <div className="flex items-center justify-between mb-4">
                                                        {isAdmin && isEditMode ? (
                                                            <div className="flex items-center gap-2">
                                                                <EditableText
                                                                    value={col.title}
                                                                    onSave={(newVal) => handleUpdateColumnTitle(activeMenuItem.id, colIdx, newVal)}
                                                                    isAdmin={true}
                                                                    className="text-xs font-bold uppercase tracking-widest text-slate-900"
                                                                />
                                                                <button
                                                                    onClick={() => handleDeleteColumn(activeMenuItem.id, colIdx)}
                                                                    className="opacity-0 group-hover/col:opacity-100 text-red-500 hover:text-red-700 text-xs"
                                                                >
                                                                    <X size={12} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900">
                                                                {col.title}
                                                            </h3>
                                                        )}
                                                    </div>

                                                    <ul className="space-y-2">
                                                        {col.items.map((link, linkIdx) => (
                                                            <li key={linkIdx} className="group/link flex flex-col mb-2">
                                                                {isAdmin && isEditMode ? (
                                                                    <div className="flex flex-col gap-1 w-full">
                                                                        <div className="flex items-center justify-between">
                                                                            <EditableText
                                                                                value={link.label}
                                                                                onSave={(newVal) => handleUpdateLink(activeMenuItem.id, colIdx, linkIdx, newVal)}
                                                                                isAdmin={true}
                                                                                className="text-sm text-slate-600 hover:text-[#006D77] transition-colors block w-full font-medium"
                                                                            />
                                                                            <button
                                                                                onClick={() => handleDeleteLink(activeMenuItem.id, colIdx, linkIdx)}
                                                                                className="text-red-400 hover:text-red-600 ml-2"
                                                                            >
                                                                                <X size={12} />
                                                                            </button>
                                                                        </div>
                                                                        <EditableText
                                                                            value={link.href}
                                                                            onSave={(newVal) => handleUpdateLinkHref(activeMenuItem.id, colIdx, linkIdx, newVal)}
                                                                            isAdmin={true}
                                                                            className="text-[10px] text-gray-400 hover:text-[#006D77] block w-full font-mono"
                                                                        />
                                                                    </div>
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
                                                    className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-[#006D77] border border-dashed border-gray-300 p-4 rounded text-center hover:border-[#006D77] transition-colors shrink-0"
                                                >
                                                    + Add
                                                </button>
                                            )}
                                        </div>

                                        {/* Right: Images Carousel (flex-1 takes remaining space) */}
                                        <div className="flex-1 overflow-hidden">
                                            {activeMenuItem.images && (
                                                <MenuCarousel
                                                    images={activeMenuItem.images}
                                                    isAdmin={isAdmin && isEditMode}
                                                    onDelete={(idx) => handleDeleteImage(activeMenuItem.id, idx)}
                                                    onAdd={() => handleAddImage(activeMenuItem.id)}
                                                    imageWidth={180}
                                                    imageHeight={225}
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* VISUAL LAYOUT (About) */}
                                {activeMenuItem.shopify_layout_type === "visual" && (
                                    <div className="flex gap-8 justify-center">
                                        {activeMenuItem.images?.map((img, idx) => (
                                            <motion.div key={idx} variants={itemVariants}>
                                                <Link href={img.href} className="group block text-center">
                                                    <div
                                                        className="relative overflow-hidden mb-4 rounded-sm"
                                                        style={{ width: '180px', height: '225px' }}
                                                    >
                                                        <Image
                                                            src={img.src}
                                                            alt={img.label}
                                                            fill
                                                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                                                        />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                                                    </div>
                                                    <h3 className="text-xs font-geist uppercase tracking-[0.2em] text-slate-900">
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
