"use client";

import { motion } from "framer-motion";
import EditableText from "@/components/admin/EditableText";

interface AboutStorySectionProps {
    data?: {
        heading?: string;
        leftParagraph?: string;
        rightParagraph?: string;
    };
    isEditMode?: boolean;
    onUpdate?: (data: any) => void;
}

export default function AboutStorySection({ data = {}, isEditMode = false, onUpdate }: AboutStorySectionProps) {
    const {
        heading = "We pride ourselves by following subcultures and translating the essences into fashion just before they become mainstream.",
        leftParagraph = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
        rightParagraph = "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt."
    } = data;

    const updateField = (field: string, value: string) => {
        if (!onUpdate) return;
        onUpdate({ ...data, [field]: value });
    };

    const fadeInUp = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: [0.7, 0, 0.84, 0] as const
            }
        }
    };

    return (
        <section className="w-full mt-[40px] md:mt-[80px] px-4">
            <div className="w-full max-w-[1500px] mx-auto min-h-[280px] md:min-h-[336px] flex flex-col items-center">
                {/* Heading - max 1000px wide */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeInUp}
                    className="w-full max-w-[1000px] mb-8 md:mb-12"
                >
                    {isEditMode ? (
                        <EditableText
                            value={heading}
                            onSave={(val) => updateField("heading", val)}
                            isAdmin={true}
                            multiline={true}
                            className="text-[28px] md:text-[48px] leading-[36px] md:leading-[52px] tracking-[-1px] text-center text-[#1a1a1a] font-lora bg-gray-100 border-b border-gray-300 px-2 py-1 w-full"
                        />
                    ) : (
                        <h2
                            className="text-[28px] md:text-[48px] leading-[36px] md:leading-[52px] tracking-[-1px] text-center text-[#1a1a1a] font-lora"
                        >
                            {heading}
                        </h2>
                    )}
                </motion.div>

                {/* Two Column Paragraphs */}
                <div className="w-full flex flex-col md:flex-row justify-center gap-8 md:gap-16">
                    {/* Left Paragraph */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeInUp}
                        className="w-full md:w-[410px]"
                    >
                        {isEditMode ? (
                            <EditableText
                                value={leftParagraph}
                                onSave={(val) => updateField("leftParagraph", val)}
                                isAdmin={true}
                                multiline={true}
                                className="text-[14px] md:text-[15px] leading-[24px] md:leading-[26px] text-left text-[#1a1a1a] font-figtree bg-gray-100 border-b border-gray-300 px-2 py-1 w-full"
                            />
                        ) : (
                            <p
                                className="text-[14px] md:text-[15px] leading-[24px] md:leading-[26px] text-left text-[#1a1a1a] font-figtree"
                            >
                                {leftParagraph}
                            </p>
                        )}
                    </motion.div>

                    {/* Right Paragraph */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeInUp}
                        className="w-full md:w-[410px]"
                    >
                        {isEditMode ? (
                            <EditableText
                                value={rightParagraph}
                                onSave={(val) => updateField("rightParagraph", val)}
                                isAdmin={true}
                                multiline={true}
                                className="text-[14px] md:text-[15px] leading-[24px] md:leading-[26px] text-left text-[#1a1a1a] font-figtree bg-gray-100 border-b border-gray-300 px-2 py-1 w-full"
                            />
                        ) : (
                            <p
                                className="text-[14px] md:text-[15px] leading-[24px] md:leading-[26px] text-left text-[#1a1a1a] font-figtree"
                            >
                                {rightParagraph}
                            </p>
                        )}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
