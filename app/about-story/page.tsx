"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AboutHeroBanner from "@/components/AboutHeroBanner";
import AboutStorySection from "@/components/AboutStorySection";
import AboutImageTextBlock from "@/components/AboutImageTextBlock";
import PremiumPreloader from "@/components/PremiumPreloader";
import { Trash2 } from "lucide-react";
import { PageContent } from "@/types/page-editor";

// Default Initial Content
import { TEMPLATE_ABOUT_STORY } from "@/lib/templates";

const DEFAULT_CONTENT: PageContent = TEMPLATE_ABOUT_STORY;

export default function AboutStoryPage() {
    const { isAdmin } = useAuth();
    const [content, setContent] = useState<PageContent>(DEFAULT_CONTENT);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [loading, setLoading] = useState(true);

    // Fetch Page Content
    useEffect(() => {
        async function fetchContent() {
            try {
                const res = await fetch("/api/builder/content?handle=about-story");
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.sections && data.sections.length > 0) {
                        setContent(data);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch page content:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchContent();
    }, []);

    // Save Page Content
    const saveChanges = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/builder/content", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ handle: "about-story", data: content }),
            });
            if (!res.ok) throw new Error("Failed to save");
            alert("Changes saved successfully!");
            setIsEditMode(false);
        } catch (error) {
            console.error("Failed to save:", error);
            alert("Failed to save changes.");
        } finally {
            setIsSaving(false);
        }
    };

    // Delete Page
    const deletePage = async () => {
        if (!confirm("Are you sure you want to delete this page? This action cannot be undone.")) return;

        setIsDeleting(true);
        try {
            const res = await fetch("/api/builder/content?handle=about-story", {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete");
            alert("Page deleted successfully!");
            window.location.reload();
        } catch (error) {
            console.error("Failed to delete:", error);
            alert("Failed to delete page.");
        } finally {
            setIsDeleting(false);
        }
    };

    // Update Section Helper
    const updateSection = useCallback((sectionId: string, newSettings: any) => {
        setContent((prev) => ({
            ...prev,
            sections: prev.sections.map((section) =>
                section.id === sectionId
                    ? { ...section, settings: { ...section.settings, ...newSettings } }
                    : section
            ),
        }));
    }, []);

    // Get section by type helper
    const getSection = (type: string) => {
        return content.sections.find((s) => s.type === type);
    };

    if (loading) return <PremiumPreloader />;

    const heroSection = getSection("about_hero_banner");
    const storySection = getSection("about_story_section");
    const imageTextSection = getSection("about_image_text_block");

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            {/* Admin Controls */}
            {isAdmin && (
                <div className="fixed bottom-6 right-6 z-50 flex gap-4">
                    {isEditMode ? (
                        <>
                            <button
                                onClick={() => setIsEditMode(false)}
                                className="bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={deletePage}
                                disabled={isDeleting}
                                className="bg-red-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                <Trash2 size={18} />
                                {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                            <button
                                onClick={saveChanges}
                                disabled={isSaving}
                                className="bg-[#006D77] text-white px-6 py-3 rounded-full shadow-lg hover:bg-[#005a63] transition-colors disabled:opacity-50"
                            >
                                {isSaving ? "Saving..." : "Save Changes"}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsEditMode(true)}
                            className="bg-black text-white px-6 py-3 rounded-full shadow-lg hover:bg-gray-900 transition-colors"
                        >
                            Edit Page
                        </button>
                    )}
                </div>
            )}

            {/* Hero Banner Section */}
            {heroSection && (
                <AboutHeroBanner
                    data={heroSection.settings as any}
                    isEditMode={isEditMode}
                    onUpdate={(newSettings) => updateSection(heroSection.id, newSettings)}
                />
            )}

            {/* Story Section */}
            {storySection && (
                <AboutStorySection
                    data={storySection.settings as any}
                    isEditMode={isEditMode}
                    onUpdate={(newSettings) => updateSection(storySection.id, newSettings)}
                />
            )}

            {/* Image + Text Block Section */}
            {imageTextSection && (
                <AboutImageTextBlock
                    data={imageTextSection.settings as any}
                    isEditMode={isEditMode}
                    onUpdate={(newSettings) => updateSection(imageTextSection.id, newSettings)}
                />
            )}

            {/* Spacer before footer */}
            <div className="h-20" />

            <Footer />
        </main>
    );
}
