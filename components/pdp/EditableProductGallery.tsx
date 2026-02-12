"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import ProductImage from "@/components/ui/ProductImage";
import { motion, AnimatePresence } from "framer-motion";
import { ZoomIn, X, ChevronLeft, ChevronRight, Play, Plus, Trash2, Upload, ImagePlus, GripVertical } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import SimpleImageUploadModal from "@/components/admin/SimpleImageUploadModal";
import { uploadMediaAction } from "@/app/actions/upload-media";

interface EditableProductGalleryProps {
    images: {
        edges: {
            node: {
                url: string;
                altText: string;
            };
        }[];
    };
    video?: string | null;
    isEditMode?: boolean;
    onImagesChange?: (imageUrls: string[]) => void;
}

export default function EditableProductGallery({
    images,
    video,
    isEditMode = false,
    onImagesChange
}: EditableProductGalleryProps) {
    const { isAdmin, user } = useAuth();
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [imageAspectRatios, setImageAspectRatios] = useState<Record<string, number>>({});
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    // Local state for editable images
    const [editableImages, setEditableImages] = useState<string[]>([]);

    // Initialize editable images from props
    useEffect(() => {
        const urls = images?.edges?.map(edge => edge.node.url) || [];
        setEditableImages(urls);
    }, [images]);

    // Combine images and video into a single media list
    const mediaList = [
        ...editableImages.map(url => ({
            type: 'image' as const,
            url,
            alt: "Product image"
        })),
        ...(video ? [{
            type: 'video' as const,
            url: video,
            alt: "Product Video"
        }] : [])
    ];

    // Auto-select first item if available
    useEffect(() => {
        if (mediaList.length > 0 && selectedIndex >= mediaList.length) {
            setSelectedIndex(0);
        }
    }, [mediaList.length, selectedIndex]);

    const handleImageLoad = (url: string, e: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        if (naturalWidth && naturalHeight) {
            const ratio = naturalWidth / naturalHeight;
            setImageAspectRatios(prev => ({ ...prev, [url]: ratio }));
        }
    };

    const nextMedia = () => {
        setSelectedIndex((prev) => (prev + 1) % mediaList.length);
    };

    const prevMedia = () => {
        setSelectedIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
    };

    const handleRemoveImage = (indexToRemove: number) => {
        // Don't allow removing the last image
        if (editableImages.length <= 1) return;

        const newImages = editableImages.filter((_, index) => index !== indexToRemove);
        setEditableImages(newImages);
        onImagesChange?.(newImages);

        // Adjust selected index if needed
        if (selectedIndex >= newImages.length) {
            setSelectedIndex(Math.max(0, newImages.length - 1));
        }
    };

    // Drag and drop handlers for image reordering
    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        // Reorder images
        const newImages = [...editableImages];
        const draggedImage = newImages[draggedIndex];

        // Remove from old position
        newImages.splice(draggedIndex, 1);

        // Insert at new position
        newImages.splice(index, 0, draggedImage);

        setEditableImages(newImages);
        onImagesChange?.(newImages);
        setDraggedIndex(index);

        // Update selected index to follow the dragged image
        if (selectedIndex === draggedIndex) {
            setSelectedIndex(index);
        }
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const handleUploadImage = async (file: File) => {
        if (!user) {
            throw new Error("Authentication required");
        }

        // Get Firebase ID token dynamically
        const authToken = await user.getIdToken();

        const formData = new FormData();
        formData.append("file", file);
        formData.append("token", authToken);
        formData.append("folder", "products");

        const result = await uploadMediaAction(formData);

        if (!result.success || !result.url) {
            throw new Error(result.error || "Upload failed");
        }

        const newImages = [...editableImages, result.url];
        setEditableImages(newImages);
        onImagesChange?.(newImages);
    };

    if (!mediaList.length && !isEditMode) return null;

    const selectedMedia = mediaList[selectedIndex] || mediaList[0];

    // Determine current aspect ratio class
    const currentAspectRatioClass = selectedMedia?.type === 'image' && imageAspectRatios[selectedMedia.url] && imageAspectRatios[selectedMedia.url] > 1.1
        ? "aspect-[4/3]"
        : "aspect-[3/4]";

    const showEditControls = isAdmin && isEditMode;

    return (
        <>
            <div className="flex flex-col-reverse md:flex-row gap-4 sticky top-24">
                {/* Thumbnails (Left Side on Desktop) */}
                <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto md:max-h-[calc(100vh-12rem)] scrollbar-hide touch-manipulation">
                    {mediaList.map((media, index) => {
                        const isImage = media.type === 'image';
                        const imageIndex = isImage ? editableImages.indexOf(media.url) : -1;
                        const isDragging = draggedIndex === imageIndex;

                        return (
                            <motion.div
                                key={`${media.url}-${index}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1, duration: 0.5 }}
                                className={`relative flex-shrink-0 ${showEditControls && isImage ? 'cursor-move' : ''} ${isDragging ? 'opacity-50 scale-95' : ''}`}
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                                draggable={showEditControls && isImage}
                                onDragStart={() => isImage && handleDragStart(imageIndex)}
                                onDragOver={(e) => isImage && handleDragOver(e, imageIndex)}
                                onDragEnd={handleDragEnd}
                            >
                                <button
                                    onClick={() => setSelectedIndex(index)}
                                    className={`relative w-20 h-24 md:w-24 md:h-32 border-2 transition-all overflow-hidden bg-gray-100 ${selectedIndex === index
                                        ? "border-slate-900 opacity-100"
                                        : "border-transparent opacity-70 hover:opacity-100"
                                        } ${isDragging ? 'border-dashed border-slate-400' : ''}`}
                                >
                                    {media.type === 'video' ? (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                            <Play size={24} className="text-slate-900" fill="currentColor" />
                                        </div>
                                    ) : (
                                        <Image
                                            src={media.url}
                                            alt={media.alt}
                                            fill
                                            className="object-cover pointer-events-none"
                                            sizes="96px"
                                        />
                                    )}
                                </button>

                                {/* Drag Handle - visible in edit mode */}
                                {showEditControls && isImage && (
                                    <div className="absolute top-1 left-1 p-1 bg-black/50 text-white rounded opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity duration-200 z-10">
                                        <GripVertical size={12} />
                                    </div>
                                )}

                                {/* Position Badge - in edit mode */}
                                {showEditControls && isImage && (
                                    <div className={`absolute bottom-1 left-1 px-1.5 py-0.5 text-[9px] font-bold rounded z-10 ${imageIndex === 0
                                        ? 'bg-emerald-500 text-white'
                                        : imageIndex === 1
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-700 text-white'
                                        }`}>
                                        {imageIndex === 0 ? 'MAIN' : imageIndex === 1 ? 'HOVER' : `#${imageIndex + 1}`}
                                    </div>
                                )}

                                {/* Delete button overlay for edit mode */}
                                {showEditControls && isImage && editableImages.length > 1 && (
                                    <AnimatePresence>
                                        {hoveredIndex === index && (
                                            <motion.button
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveImage(imageIndex);
                                                }}
                                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-10"
                                                title="Remove image"
                                            >
                                                <X size={14} />
                                            </motion.button>
                                        )}
                                    </AnimatePresence>
                                )}
                            </motion.div>
                        );
                    })}

                    {/* Add Image Button (Edit Mode) */}
                    {showEditControls && (
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: mediaList.length * 0.1, duration: 0.5 }}
                            onClick={() => setIsUploadModalOpen(true)}
                            className="w-20 h-24 md:w-24 md:h-32 flex-shrink-0 border-2 border-dashed border-[#006D77] bg-[#006D77]/5 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-[#006D77]/10 transition-colors group"
                        >
                            <ImagePlus size={24} className="text-[#006D77] group-hover:scale-110 transition-transform" />
                            <span className="text-xs text-[#006D77] font-medium">Add</span>
                        </motion.button>
                    )}

                    {/* Drag hint */}
                    {showEditControls && editableImages.length > 1 && (
                        <p className="hidden md:block text-[10px] text-gray-500 text-center mt-2 px-2">
                            💡 Drag to reorder<br />1st = display, 2nd = hover
                        </p>
                    )}
                </div>

                {/* Main Media Display */}
                <motion.div
                    className={`flex-1 relative ${currentAspectRatioClass} bg-gray-100 overflow-hidden group transition-all duration-500 ease-in-out`}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <AnimatePresence mode="wait">
                        {selectedMedia && (
                            <motion.div
                                key={selectedIndex}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="absolute inset-0"
                            >
                                {selectedMedia.type === 'video' ? (
                                    <video
                                        src={selectedMedia.url}
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                        controls
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <ProductImage
                                        src={selectedMedia.url}
                                        alt={selectedMedia.alt}
                                        fill
                                        className="object-contain"
                                        priority
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                        containerClassName="absolute inset-0"
                                        onLoad={(e) => handleImageLoad(selectedMedia.url, e)}
                                    />
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Edit Mode Overlay */}
                    {showEditControls && selectedMedia?.type === 'image' && (
                        <div className="absolute inset-0 pointer-events-none">
                            {/* Gradient overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            {/* Edit badge */}
                            <div className="absolute top-4 left-4 bg-[#006D77] text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-lg">
                                <Upload size={12} />
                                Edit Mode
                            </div>
                        </div>
                    )}

                    {/* Navigation Zones */}
                    {!showEditControls && mediaList.length > 1 && (
                        <>
                            <div
                                className="absolute inset-y-0 left-0 w-1/4 cursor-[w-resize] z-10"
                                onClick={prevMedia}
                                title="Previous"
                            />
                            <div
                                className="absolute inset-y-0 right-0 w-1/4 cursor-[e-resize] z-10"
                                onClick={nextMedia}
                                title="Next"
                            />
                        </>
                    )}

                    {/* Navigation buttons in edit mode */}
                    {showEditControls && mediaList.length > 1 && (
                        <>
                            <button
                                onClick={prevMedia}
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors z-10"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={nextMedia}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors z-10"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </>
                    )}

                    {/* Zoom Button (Only for Images, not in edit mode) */}
                    {!showEditControls && selectedMedia?.type === 'image' && (
                        <button
                            onClick={() => setIsLightboxOpen(true)}
                            className="absolute bottom-4 right-4 bg-white p-2 rounded-full shadow-md hover:scale-110 transition-transform z-20"
                        >
                            <ZoomIn size={20} />
                        </button>
                    )}

                    {/* Add overlay button on main image in edit mode */}
                    {showEditControls && (
                        <button
                            onClick={() => setIsUploadModalOpen(true)}
                            className="absolute bottom-4 right-4 bg-[#006D77] text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-[#005a63] transition-colors z-20"
                        >
                            <Plus size={16} />
                            <span className="text-sm font-medium">Add Image</span>
                        </button>
                    )}
                </motion.div>
            </div>

            {/* Lightbox Modal (Only for Images) */}
            <AnimatePresence>
                {isLightboxOpen && selectedMedia?.type === 'image' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        <button
                            className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full"
                            onClick={() => setIsLightboxOpen(false)}
                        >
                            <X size={32} />
                        </button>

                        <button
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-2 hover:bg-white/10 rounded-full"
                            onClick={(e) => { e.stopPropagation(); prevMedia(); }}
                        >
                            <ChevronLeft size={48} />
                        </button>

                        <button
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-2 hover:bg-white/10 rounded-full"
                            onClick={(e) => { e.stopPropagation(); nextMedia(); }}
                        >
                            <ChevronRight size={48} />
                        </button>

                        <div className="relative w-full h-full max-w-5xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                            <Image
                                src={selectedMedia.url}
                                alt="Zoomed View"
                                fill
                                className="object-contain"
                                quality={100}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Upload Modal */}
            <SimpleImageUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUpload={handleUploadImage}
                title="Add Product Image"
                aspectRatio={3 / 4}
            />
        </>
    );
}
