"use client";

import { useState } from "react";
import { Upload, Video, Plus, X } from "lucide-react";
import EditableText from "@/components/admin/EditableText";
import SimpleImageUploadModal from "@/components/admin/SimpleImageUploadModal";

interface VideoItem {
    id: string;
    videoUrl: string;
}

interface VideoPromoProps {
    data?: {
        title?: string;
        subtitle?: string;
        videos?: VideoItem[];
    };
    isEditMode?: boolean;
    onUpdate?: (data: any) => void;
}

const DEFAULT_DATA = {
    title: "Our Story in Motion",
    subtitle: "Experience the elegance",
    videos: [] as VideoItem[],
};

export default function VideoPromo({ data, isEditMode = false, onUpdate }: VideoPromoProps) {
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const {
        title = DEFAULT_DATA.title,
        subtitle = DEFAULT_DATA.subtitle,
        videos = DEFAULT_DATA.videos,
    } = data || {};

    const updateField = (field: string, value: any) => {
        if (!onUpdate) return;
        onUpdate({ ...data, [field]: value });
    };

    const handleVideoUpload = async (file: File) => {
        if (!onUpdate) return;

        setIsUploading(true);
        try {
            const { getAuthToken } = await import("@/lib/auth-client");
            const token = await getAuthToken();

            if (!token) {
                alert("Please log in to upload.");
                return;
            }

            const formData = new FormData();
            formData.append("file", file);
            formData.append("token", token);

            const { uploadMediaAction } = await import("@/app/actions/upload-media");
            const result = await uploadMediaAction(formData);

            if (!result.success) throw new Error(result.error);

            const newVideo: VideoItem = {
                id: `vid-${Date.now()}`,
                videoUrl: result.url,
            };

            const updatedVideos = [...videos, newVideo];
            onUpdate({ ...data, videos: updatedVideos });
            setIsUploadModalOpen(false);
        } catch (error: any) {
            console.error("Upload failed:", error);
            alert(`Failed to upload video: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const removeVideo = (id: string) => {
        if (!onUpdate) return;
        const updatedVideos = videos.filter(v => v.id !== id);
        onUpdate({ ...data, videos: updatedVideos });
    };

    // Calculate grid columns based on number of videos
    const getGridClasses = () => {
        const count = videos.length;
        if (count === 0) return "grid-cols-1";
        if (count === 1) return "grid-cols-1 max-w-xs mx-auto";
        if (count === 2) return "grid-cols-2 max-w-lg mx-auto";
        if (count === 3) return "grid-cols-3 max-w-2xl mx-auto";
        if (count === 4) return "grid-cols-2 md:grid-cols-4 max-w-3xl mx-auto";
        return "grid-cols-2 md:grid-cols-3 lg:grid-cols-5"; // 5 videos
    };

    // No videos - show placeholder / upload button
    if (videos.length === 0 && !isEditMode) {
        return null; // Hide section if no videos and not in edit mode
    }

    return (
        <section className="py-16 md:py-24 bg-[#FDFBF7]">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12">
                    {isEditMode ? (
                        <>
                            <EditableText
                                value={subtitle}
                                onSave={(val) => updateField("subtitle", val)}
                                isAdmin={true}
                                className="text-sm font-bold tracking-[0.2em] uppercase text-[#006D77] mb-3"
                            />
                            <EditableText
                                value={title}
                                onSave={(val) => updateField("title", val)}
                                isAdmin={true}
                                className="text-3xl md:text-5xl font-lora text-slate-900"
                            />
                        </>
                    ) : (
                        <>
                            <span className="text-sm font-bold tracking-[0.2em] uppercase text-[#006D77] mb-3 block">
                                {subtitle}
                            </span>
                            <h2 className="text-3xl md:text-5xl font-lora text-slate-900">
                                {title}
                            </h2>
                        </>
                    )}
                </div>

                {/* Video Grid */}
                <div className={`grid gap-4 md:gap-6 ${getGridClasses()}`}>
                    {videos.map((video) => (
                        <div
                            key={video.id}
                            className="relative aspect-[9/16] rounded-xl overflow-hidden bg-gray-100 shadow-lg group"
                        >
                            <video
                                autoPlay
                                muted
                                loop
                                playsInline
                                className="absolute inset-0 w-full h-full object-cover"
                            >
                                <source src={video.videoUrl} type="video/mp4" />
                            </video>

                            {/* Remove button in edit mode */}
                            {isEditMode && (
                                <button
                                    onClick={() => removeVideo(video.id)}
                                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                                    title="Remove video"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    ))}

                    {/* Add Video Button (Edit Mode Only) */}
                    {isEditMode && videos.length < 5 && (
                        <button
                            onClick={() => setIsUploadModalOpen(true)}
                            disabled={isUploading}
                            className="aspect-[9/16] rounded-xl border-2 border-dashed border-gray-300 hover:border-[#006D77] transition-colors flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-[#006D77] disabled:opacity-50"
                        >
                            {isUploading ? (
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-current border-t-transparent" />
                            ) : (
                                <>
                                    <Plus size={32} />
                                    <span className="text-sm font-medium">Add Video</span>
                                    <span className="text-xs opacity-60">{videos.length}/5</span>
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Empty State for Edit Mode */}
                {isEditMode && videos.length === 0 && (
                    <div className="text-center text-gray-400 mt-8">
                        <Video size={48} className="mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Add up to 5 portrait videos to showcase your collection</p>
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            <SimpleImageUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUpload={handleVideoUpload}
                accept="video/*"
                title="Upload Portrait Video"
            />
        </section>
    );
}
