"use client";

import { useState } from "react";
import { Video, Plus, X } from "lucide-react";
import EditableText from "@/components/admin/EditableText";

/**
 * YouTube Embed Component
 * configured for seamless loop, autoplay, and minimal UI
 */
function YouTubeEmbed({ videoId, className }: { videoId: string; className: string }) {
    // Parameters for "clean" playback:
    // autoplay=1: Start immediately
    // mute=1: Required for autoplay
    // controls=0: Hide bottom controls
    // loop=1 & playlist=ID: Loop the single video
    // playsinline=1: Don't go fullscreen on iOS
    // rel=0: Don't show related videos from others
    // modestbranding=1: Minimal YouTube logo
    // disablekb=1: Disable keyboard shortcuts
    // vq: hd720 (try to force 720p, though often ignored by YT adaptive)
    const params = new URLSearchParams({
        autoplay: "1",
        mute: "1",
        controls: "0",
        loop: "1",
        playlist: videoId,
        playsinline: "1",
        rel: "0",
        modestbranding: "1",
        disablekb: "1",
        iv_load_policy: "3",
        vq: "hd720", // Attempt to request 720p
    });

    return (
        <div className={`relative overflow-hidden bg-black ${className}`}>
            <iframe
                src={`https://www.youtube.com/embed/${videoId}?${params.toString()}`}
                className="absolute top-0 left-0 w-full h-full pointer-events-none" // Scale 1 (default)
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Video Promo"
            />

            {/* Temporary black overlay to hide initial YouTube controls */}
            {/* Fades out after 3.5s (delay 0.5s + duration 1s + extra hold time handled by keyframes/class) */}
            {/* Using a simple CSS animation class would be best, but we can do it with a transient div */}
            <div className="absolute inset-0 bg-black z-20 pointer-events-none animate-fadeOut opacity-0"
                style={{ animation: 'fadeOut 0.5s ease-in 2.5s forwards reverse' }} />
            {/* Actually 'reverse' isn't what we want. We want start opaque, then fade out. */}
            {/* Let's try a cleaner approach: Keyframes are standard. */}
            {/* Simple styling: Start bg-black, transition opacity to 0 after delay */}
            <div className="absolute inset-0 bg-black z-20 pointer-events-none transition-opacity duration-1000 delay-[2500ms] opacity-0 animate-[fadeOut_3s_forwards]" />

            {/* Wait, standard tailwind doesn't have fadeOut keyframes by default usually. */}
            {/* Better approach: Styled div with initial opacity 1, then use class to fade out? */}
            {/* Or just inline style for simplicity given the constraints. */}

            <div
                className="absolute inset-0 bg-black z-20 pointer-events-none"
                style={{
                    animation: "fadeOutOverlay 1s ease-out 2.5s forwards"
                }}
            />
            {/* Define keyframes in a style tag for this component to be self-contained */}
            <style jsx>{`
                @keyframes fadeOutOverlay {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `}</style>

            {/* Overlay to ensure clicks don't pause video */}
            <div className="absolute inset-0 z-10 bg-transparent" />
        </div>
    );
}

interface VideoItem {
    id: string;
    videoUrl: string;
    heading?: string;
    subheading?: string;
    buttonText?: string;
    link?: string;
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
    const [inputValue, setInputValue] = useState("");

    const {
        title = DEFAULT_DATA.title,
        subtitle = DEFAULT_DATA.subtitle,
        videos = DEFAULT_DATA.videos,
    } = data || {};

    const updateField = (field: string, value: any) => {
        if (!onUpdate) return;
        onUpdate({ ...data, [field]: value });
    };

    const updateVideo = (id: string, field: keyof VideoItem, value: string) => {
        const updatedVideos = videos?.map(v =>
            v.id === id ? { ...v, [field]: value } : v
        );
        updateField("videos", updatedVideos);
    };

    // Extract Video ID from various YouTube URL formats
    const getYouTubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);

        // Handle Shorts URLs specifically if not covered above
        if (!match || match[2].length !== 11) {
            const shortsMatch = url.match(/youtube\.com\/shorts\/([^#&?]*)/);
            return (shortsMatch && shortsMatch[1].length === 11) ? shortsMatch[1] : null;
        }

        return match && match[2].length === 11 ? match[2] : null;
    };

    const handleAddVideo = () => {
        if (!inputValue.trim()) return;

        const videoId = getYouTubeId(inputValue);
        if (!videoId) {
            alert("Please enter a valid YouTube or Shorts URL");
            return;
        }

        const newVideo: VideoItem = {
            id: `vid-${Date.now()}`,
            videoUrl: videoId,
            heading: "Create Your Legacy",
            subheading: "NEW COLLECTION",
            buttonText: "Shop Now",
            link: "/collections/all"
        };

        const updatedVideos = [...(videos || []), newVideo];
        updateField("videos", updatedVideos);
        setInputValue("");
    };

    const removeVideo = (id: string) => {
        const updatedVideos = (videos || []).filter(v => v.id !== id);
        updateField("videos", updatedVideos);
    };

    // Calculate grid columns based on number of videos
    const getGridClasses = () => {
        const count = videos?.length || 0;
        if (count === 0) return "hidden";
        if (count === 1) return "grid-cols-1";
        if (count === 2) return "grid-cols-2";
        if (count === 3) return "grid-cols-3";
        return "grid-cols-2 md:grid-cols-4";
    };

    return (
        <section className="py-20 bg-white">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <EditableText
                        value={title}
                        onSave={(val) => updateField("title", val)}
                        isAdmin={isEditMode}
                        className="text-4xl font-serif text-[#1A1A1A] mb-4 block"
                    />
                    <EditableText
                        value={subtitle}
                        onSave={(val) => updateField("subtitle", val)}
                        isAdmin={isEditMode}
                        className="text-gray-600 block"
                    />
                </div>

                <div className="max-w-6xl mx-auto">
                    {/* Add Video Input (Admin Only) */}
                    {isEditMode && (videos?.length || 0) < 5 && (
                        <div className="mb-8 p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                            <h3 className="font-medium text-gray-700 mb-3">Add YouTube Video</h3>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Paste YouTube Link (e.g., https://youtube.com/shorts/...)"
                                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#006D77] outline-none"
                                />
                                <button
                                    onClick={handleAddVideo}
                                    className="px-6 py-2 bg-[#006D77] text-white rounded-lg hover:bg-[#005a63] font-medium flex items-center gap-2"
                                >
                                    <Plus size={18} />
                                    Add
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Tip: Use YouTube Shorts for best portrait layout results. Videos will autoplay and loop silently.
                            </p>
                        </div>
                    )}

                    {/* Video Grid */}
                    <div className={`grid ${getGridClasses()} gap-4 h-[600px]`}>
                        {videos?.map((video) => (
                            <div
                                key={video.id}
                                className="relative h-full overflow-hidden group bg-black rounded-xl shadow-lg"
                            >
                                <YouTubeEmbed
                                    videoId={video.videoUrl}
                                    className="w-full h-full"
                                />

                                {/* Text Overlay */}
                                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center p-6 bg-black/20 hover:bg-black/30 transition-colors pointer-events-none">
                                    <div className="pointer-events-auto">
                                        <EditableText
                                            value={video.subheading || ""}
                                            onSave={(val) => updateVideo(video.id, "subheading", val)}
                                            isAdmin={isEditMode}
                                            className="text-xs md:text-sm font-bold tracking-[0.2em] uppercase text-white/90 mb-3 block"
                                            placeholder="SUBHEADING"
                                        />
                                        <EditableText
                                            value={video.heading || ""}
                                            onSave={(val) => updateVideo(video.id, "heading", val)}
                                            isAdmin={isEditMode}
                                            className="text-2xl md:text-4xl font-serif text-white mb-6 block drop-shadow-md"
                                            placeholder="Heading"
                                        />

                                        {/* Button/Link */}
                                        <div className="inline-block">
                                            {isEditMode ? (
                                                <div className="flex flex-col gap-1">
                                                    <EditableText
                                                        value={video.buttonText || "Shop Now"}
                                                        onSave={(val) => updateVideo(video.id, "buttonText", val)}
                                                        isAdmin={true}
                                                        className="text-sm font-medium text-white border-b border-white/50 pb-1"
                                                    />
                                                    <EditableText
                                                        value={video.link || "#"}
                                                        onSave={(val) => updateVideo(video.id, "link", val)}
                                                        isAdmin={true}
                                                        className="text-[10px] text-white/70"
                                                        placeholder="/link-url"
                                                    />
                                                </div>
                                            ) : (
                                                <a
                                                    href={video.link || "/collections/all"}
                                                    className="text-sm font-medium text-white border-b border-white/50 pb-1 hover:border-white transition-colors uppercase tracking-wide cursor-pointer"
                                                >
                                                    {video.buttonText || "Shop Now"}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>


                                {/* Remove button in edit mode */}
                                {isEditMode && (
                                    <button
                                        onClick={() => removeVideo(video.id)}
                                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-30 hover:bg-red-600 pointer-events-auto"
                                        title="Remove video"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        ))}

                        {/* Empty placeholder if no videos */}
                        {videos?.length === 0 && !isEditMode && (
                            <div className="col-span-full h-64 flex items-center justify-center bg-gray-100 rounded-xl">
                                <p className="text-gray-400">No videos available</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
