"use client";

import { motion } from "framer-motion";
import EditableText from "@/components/admin/EditableText";

interface SustainabilityQuoteSectionProps {
    data?: {
        quote?: string;
        attribution?: string;
    };
    isEditMode?: boolean;
    onUpdate?: (data: any) => void;
}

export default function SustainabilityQuoteSection({
    data = {},
    isEditMode = false,
    onUpdate
}: SustainabilityQuoteSectionProps) {
    const {
        quote = "True luxury is consciousness. We are redefining our environmental footprint by integrating regenerative materials and circular practices into every step of our creation process, ensuring beauty that does not compromise the earth.",
        attribution = "— Elena Rossi, Head of Sustainable Innovation"
    } = data;

    const updateField = (field: string, value: string) => {
        if (!onUpdate) return;
        onUpdate({ ...data, [field]: value });
    };

    return (
        <section
            className="w-full"
            style={{ backgroundColor: '#E8F5F3' }}
        >
            <div
                className="w-full max-w-[1500px] mx-auto relative px-6 md:px-8 py-12 md:py-20"
            >
                {/* Large Opening Quote Mark - Hidden on mobile */}
                <div
                    className="hidden md:block absolute text-[#006D77]/30 font-lora select-none"
                    style={{
                        fontSize: '180px',
                        lineHeight: '1',
                        top: '40px',
                        left: '249px'
                    }}
                >
                    "
                </div>

                {/* Mobile Quote Mark */}
                <div className="md:hidden text-[#006D77]/30 font-lora text-[80px] leading-none -mb-6">
                    "
                </div>

                {/* Quote Text */}
                <motion.div
                    initial={{ opacity: 0.4, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                    className="pt-4 md:pt-6"
                >
                    {isEditMode ? (
                        <EditableText
                            value={quote}
                            onSave={(val) => updateField("quote", val)}
                            isAdmin={true}
                            multiline={true}
                            className="text-[22px] md:text-[30px] leading-[28px] md:leading-[34px] tracking-[-0.5px] md:tracking-[-0.7px] text-[#006D77] font-lora bg-white/50 border-b border-[#006D77]/30 px-2 py-1"
                        />
                    ) : (
                        <p className="text-[22px] md:text-[30px] leading-[28px] md:leading-[34px] tracking-[-0.5px] md:tracking-[-0.7px] text-[#006D77] font-lora">
                            {quote}
                        </p>
                    )}
                </motion.div>

                {/* Attribution */}
                <motion.div
                    initial={{ opacity: 0.4, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
                    className="mt-6 md:mt-10"
                >
                    {isEditMode ? (
                        <EditableText
                            value={attribution}
                            onSave={(val) => updateField("attribution", val)}
                            isAdmin={true}
                            className="text-[14px] md:text-[15px] leading-[24px] md:leading-[26px] text-[#006D77] font-figtree bg-white/50 border-b border-[#006D77]/30 px-2 py-1"
                        />
                    ) : (
                        <p className="text-[14px] md:text-[15px] leading-[24px] md:leading-[26px] text-[#006D77] font-figtree">
                            {attribution}
                        </p>
                    )}
                </motion.div>
            </div>
        </section>
    );
}
