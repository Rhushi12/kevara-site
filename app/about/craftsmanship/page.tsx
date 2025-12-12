"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SustainabilityBannerSection from "@/components/SustainabilityBannerSection";
import SustainabilitySliderSection from "@/components/SustainabilitySliderSection";
import SustainabilityValuesSection from "@/components/SustainabilityValuesSection";
import SustainabilityCTASection from "@/components/SustainabilityCTASection";
import { useAuth } from "@/context/AuthContext";
import { TEMPLATE_CRAFTSMANSHIP } from "@/lib/templates";

export default function CraftsmanshipPage() {
    const { isAdmin } = useAuth();
    const [content, setContent] = useState<any>(TEMPLATE_CRAFTSMANSHIP);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    // Fetch Page Content
    useEffect(() => {
        async function fetchContent() {
            try {
                const res = await fetch("/api/builder/content?handle=craftsmanship");
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
                body: JSON.stringify({ handle: "craftsmanship", data: content }),
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

    // Get section by type
    const getSection = (type: string) => {
        return content?.sections?.find((s: any) => s.type === type);
    };

    // Update section settings
    const updateSection = (type: string, newSettings: any) => {
        const newSections = content.sections.map((s: any) =>
            s.type === type ? { ...s, settings: { ...s.settings, ...newSettings } } : s
        );
        setContent({ ...content, sections: newSections });
    };

    const bannerSection = getSection("sustainability_banner_section");
    const sliderSection = getSection("sustainability_slider_section");
    const valuesSection = getSection("sustainability_values_section");
    const ctaSection = getSection("sustainability_cta_section");

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#006D77]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* Admin Controls */}
            {isAdmin && (
                <div className="fixed bottom-6 right-6 z-50 flex gap-3">
                    {isEditMode ? (
                        <>
                            <button
                                onClick={saveChanges}
                                disabled={isSaving}
                                className="bg-[#006D77] hover:bg-[#005a63] text-white px-6 py-3 rounded-full shadow-lg transition-colors disabled:opacity-50"
                            >
                                {isSaving ? "Saving..." : "Save Changes"}
                            </button>
                            <button
                                onClick={() => setIsEditMode(false)}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-full shadow-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsEditMode(true)}
                            className="bg-[#006D77] hover:bg-[#005a63] text-white px-6 py-3 rounded-full shadow-lg transition-colors"
                        >
                            Edit Page
                        </button>
                    )}
                </div>
            )}

            {/* Main Content */}
            <main>
                {/* Banner Section */}
                <SustainabilityBannerSection
                    data={bannerSection?.settings}
                    isEditMode={isEditMode}
                    onUpdate={(newData) => updateSection("sustainability_banner_section", newData)}
                />

                {/* Slider Section */}
                <SustainabilitySliderSection
                    data={sliderSection?.settings}
                    isEditMode={isEditMode}
                    onUpdate={(newData) => updateSection("sustainability_slider_section", newData)}
                />

                {/* Values Grid Section */}
                <SustainabilityValuesSection
                    data={valuesSection?.settings}
                    isEditMode={isEditMode}
                    onUpdate={(newData) => updateSection("sustainability_values_section", newData)}
                />

                {/* CTA Section */}
                <SustainabilityCTASection
                    data={ctaSection?.settings}
                    isEditMode={isEditMode}
                    onUpdate={(newData) => updateSection("sustainability_cta_section", newData)}
                />
            </main>

            <Footer />
        </div>
    );
}
