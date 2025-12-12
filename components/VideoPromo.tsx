"use client";

import { useState } from "react";
import { Heart, Upload, Video, Image as ImageIcon } from "lucide-react";
import LiquidButton from "@/components/ui/LiquidButton";
import EditableText from "@/components/admin/EditableText";
import SimpleImageUploadModal from "@/components/admin/SimpleImageUploadModal";
import DimensionBadge from "@/components/admin/DimensionBadge";

interface VideoPromoProps {
    data?: {
        subtitle?: string;
        title?: string;
        buttonText?: string;
        buttonLink?: string;
        videoUrl?: string;
        fallbackImage?: string;
        logoImage?: string;
        video_id?: string;
        logo_id?: string;
        fallback_id?: string;
    };
    isEditMode?: boolean;
    onUpdate?: (data: any) => void;
}

const DEFAULT_DATA = {
    subtitle: "Trendy Collection",
    title: "Connect. Communicate. Collaborate.",
    buttonText: "Shop Collection",
    buttonLink: "/collections/all",
    videoUrl: "https://videos.pexels.com/video-files/3205916/3205916-hd_1920_1080_25fps.mp4",
    fallbackImage: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1000&auto=format&fit=crop",
    logoImage: "",
};

export default function VideoPromo({ data, isEditMode = false, onUpdate }: VideoPromoProps) {
    const [uploadType, setUploadType] = useState<"video" | "logo" | "fallback" | null>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const {
        subtitle = DEFAULT_DATA.subtitle,
        title = DEFAULT_DATA.title,
        buttonText = DEFAULT_DATA.buttonText,
        buttonLink = DEFAULT_DATA.buttonLink,
        videoUrl = DEFAULT_DATA.videoUrl,
        fallbackImage = DEFAULT_DATA.fallbackImage,
        logoImage = DEFAULT_DATA.logoImage,
    } = data || {};

    const updateField = (field: string, value: string) => {
        if (!onUpdate) return;
        onUpdate({ ...data, [field]: value });
    };

    const handleFileUpload = async (file: File) => {
        if (!onUpdate || !uploadType) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const result = await res.json();

            if (!result.success) throw new Error("Upload failed");

            switch (uploadType) {
                case "video":
                    onUpdate({ ...data, videoUrl: result.url, video_id: result.fileId });
                    break;
                case "logo":
                    onUpdate({ ...data, logoImage: result.url, logo_id: result.fileId });
                    break;
                case "fallback":
                    onUpdate({ ...data, fallbackImage: result.url, fallback_id: result.fileId });
                    break;
            }

            setIsUploadModalOpen(false);
            setUploadType(null);
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to upload file. Note: Videos should be under 100MB for Shopify.");
        } finally {
            setIsUploading(false);
        }
    };

    const openUploadModal = (type: "video" | "logo" | "fallback") => {
        setUploadType(type);
        setIsUploadModalOpen(true);
    };

    return (
        <section className="container mx-auto px-4 py-20">
            <div className="relative h-[600px] w-full rounded-2xl overflow-hidden">
                {/* Background Video */}
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                    key={videoUrl}
                >
                    <source src={videoUrl} type="video/mp4" />
                    <img
                        src={fallbackImage}
                        alt="Fashion Promo"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                </video>

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/30" />

                {/* Dimension Badge for Admin */}
                <DimensionBadge isAdmin={isEditMode} />

                {/* Admin Controls */}
                {isEditMode && (
                    <div className="absolute top-4 right-4 z-20 flex gap-2 flex-wrap justify-end max-w-[300px]">
                        <button
                            onClick={() => openUploadModal("video")}
                            disabled={isUploading}
                            className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-3 py-2 rounded-full text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            <Video size={14} />
                            {isUploading && uploadType === "video" ? "Uploading..." : "Change Video"}
                        </button>
                        <button
                            onClick={() => openUploadModal("logo")}
                            disabled={isUploading}
                            className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-3 py-2 rounded-full text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            <ImageIcon size={14} />
                            {logoImage ? "Change Logo" : "Add Logo"}
                        </button>
                        <button
                            onClick={() => openUploadModal("fallback")}
                            disabled={isUploading}
                            className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-3 py-2 rounded-full text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            <ImageIcon size={14} />
                            Fallback Image
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4 z-10">
                    {/* Logo or Heart Icon */}
                    <div className="mb-6 animate-fade-in-up">
                        {logoImage ? (
                            <img
                                src={logoImage}
                                alt="Brand Logo"
                                className="w-16 h-16 object-contain"
                            />
                        ) : (
                            <Heart className="w-12 h-12 text-white" strokeWidth={1.5} />
                        )}
                    </div>

                    {isEditMode ? (
                        <>
                            <EditableText
                                value={subtitle}
                                onSave={(val) => updateField("subtitle", val)}
                                isAdmin={true}
                                className="text-sm md:text-base font-bold tracking-[0.2em] uppercase mb-4 bg-transparent border-b border-white/20"
                            />
                            <EditableText
                                value={title}
                                onSave={(val) => updateField("title", val)}
                                isAdmin={true}
                                className="text-4xl md:text-5xl font-lora font-medium mb-8 leading-tight max-w-3xl bg-transparent border-b border-white/20 text-center"
                            />
                            <div className="flex gap-2 items-center">
                                <EditableText
                                    value={buttonText}
                                    onSave={(val) => updateField("buttonText", val)}
                                    isAdmin={true}
                                    className="text-sm bg-transparent border-b border-white/20"
                                />
                                <EditableText
                                    value={buttonLink}
                                    onSave={(val) => updateField("buttonLink", val)}
                                    isAdmin={true}
                                    className="text-xs bg-transparent border-b border-white/20 text-white/70"
                                    placeholder="/collections/..."
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <span className="text-sm md:text-base font-bold tracking-[0.2em] uppercase mb-4 animate-fade-in-up delay-100">
                                {subtitle}
                            </span>

                            <h2 className="text-4xl md:text-6xl font-lora font-medium mb-8 leading-tight max-w-3xl animate-fade-in-up delay-200">
                                {title.split(". ").map((part, i, arr) => (
                                    <span key={i}>
                                        {part}{i < arr.length - 1 ? ". " : ""}
                                        {i === 1 && <br />}
                                    </span>
                                ))}
                            </h2>

                            <div className="animate-fade-in-up delay-300">
                                <LiquidButton
                                    href={buttonLink}
                                    variant="secondary"
                                    className="bg-white text-slate-900 hover:text-slate-900 border-none"
                                >
                                    {buttonText}
                                </LiquidButton>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <SimpleImageUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => {
                    setIsUploadModalOpen(false);
                    setUploadType(null);
                }}
                onUpload={handleFileUpload}
                accept={uploadType === "video" ? "video/*" : "image/*"}
                title={uploadType === "video" ? "Upload Video (max 100MB)" : "Upload Image"}
            />
        </section>
    );
}
