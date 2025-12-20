"use client";

import { useState } from "react";
import { Video, Plus, X } from "lucide-react";
import EditableText from "@/components/admin/EditableText";

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

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !onUpdate) return;

        setIsUploading(true);
        try {
            const { getAuthToken } = await import("@/lib/auth-client");
            const token = await getAuthToken();

            if (!token) {
                alert("Please log in to upload.");
                return;
            }

            // Use presigned URL for large video uploads
            const { getPresignedUploadUrl } = await import("@/app/actions/upload-media");
            const result = await getPresignedUploadUrl(token, file.name, file.type, "videos");

            if (!result.success || !result.uploadUrl || !result.publicUrl) {
                throw new Error(result.error || "Failed to get upload URL");
            }

            // Upload directly to R2 using presigned URL
            const uploadRes = await fetch(result.uploadUrl, {
                method: "PUT",
                body: file,
                headers: {
                    "Content-Type": file.type,
                },
            });

            if (!uploadRes.ok) throw new Error("Upload to storage failed");

            const newVideo: VideoItem = {
                id: `vid-${Date.now()}`,
                videoUrl: result.publicUrl,
            };

            const updatedVideos = [...videos, newVideo];
            onUpdate({ ...data, videos: updatedVideos });
        } catch (error: any) {
            console.error("Upload failed:", error);
            alert(`Failed to upload video: ${error.message}`);
        } finally {
            setIsUploading(false);
            e.target.value = ""; // Reset input
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
        if (count === 0) return "hidden";
        if (count === 1) return "grid-cols-1";
        if (count === 2) return "grid-cols-2";
        if (count === 3) return "grid-cols-3";
        if (count === 4) return "grid-cols-2 md:grid-cols-4";
        return "grid-cols-2 md:grid-cols-3 lg:grid-cols-5";
    };

    // Mobile responsive grid
    const getMobileGridClasses = () => {
        const count = videos.length;
        if (count <= 2) return "";
        if (count <= 3) return "grid-cols-2 sm:grid-cols-3";
        return "grid-cols-2";
    };

    // No videos - show placeholder / upload button
    if (videos.length === 0 && !isEditMode) {
        return null; // Hide section if no videos and not in edit mode
    }

    return (
        <section className="container mx-auto px-4 py-20">
            {/* Header */}
            <div className="text-center mb-10">
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

            {/* Fixed Height Container - Same as before */}
            <div className="relative h-[600px] w-full rounded-2xl overflow-hidden bg-gray-100">
                {/* Video Grid Inside Container */}
                {videos.length > 0 && (
                    <div className={`grid h-full ${getGridClasses()} ${getMobileGridClasses()}`}>
                        {videos.map((video) => (
                            <div
                                key={video.id}
                                className="relative h-full overflow-hidden group"
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
                    </div>
                )}

                {/* Empty State / Add Button */}
                {videos.length === 0 && isEditMode && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <Video size={48} className="text-gray-300 mb-4" />
                        <p className="text-gray-400 mb-4">Add up to 5 portrait videos</p>
                        <label className="cursor-pointer bg-[#006D77] text-white px-6 py-3 rounded-full font-medium hover:bg-[#005a63] transition-colors flex items-center gap-2">
                            <Plus size={18} />
                            <span>Add Video</span>
                            <input
                                type="file"
                                accept="video/*"
                                onChange={handleVideoUpload}
                                className="hidden"
                                disabled={isUploading}
                            />
                        </label>
                    </div>
                )}

                {/* Add More Button - Overlay in corner */}
                {isEditMode && videos.length > 0 && videos.length < 5 && (
                    <label className="absolute bottom-4 right-4 z-20 cursor-pointer bg-white/90 backdrop-blur-sm text-slate-900 px-4 py-2 rounded-full font-medium hover:bg-white transition-colors flex items-center gap-2 shadow-lg">
                        {isUploading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-900 border-t-transparent" />
                        ) : (
                            <Plus size={16} />
                        )}
                        <span>{isUploading ? "Uploading..." : `Add Video (${videos.length}/5)`}</span>
                        <input
                            type="file"
                            accept="video/*"
                            onChange={handleVideoUpload}
                            className="hidden"
                            disabled={isUploading}
                        />
                    </label>
                )}
            </div>
        </section>
    );
}
