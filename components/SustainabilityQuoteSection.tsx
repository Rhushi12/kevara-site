"use client";

import { useState } from "react";
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
            className="w-full flex justify-center"
            style={{ backgroundColor: '#E8F5F3' }}
        >
            <div
                className="w-full relative"
                style={{
                    maxWidth: '1374px',
                    paddingTop: '80px',
                    paddingBottom: '80px',
                    paddingLeft: '318px',
                    paddingRight: '219px'
                }}
            >
                {/* Large Opening Quote Mark */}
                <div
                    className="absolute text-[#006D77]/30 font-lora select-none"
                    style={{
                        fontSize: '180px',
                        lineHeight: '1',
                        top: '40px',
                        left: '249px'
                    }}
                >
                    "
                </div>

                {/* Quote Text */}
                <motion.div
                    initial={{ opacity: 0.4, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                    style={{ paddingTop: '24px' }}
                >
                    {isEditMode ? (
                        <EditableText
                            value={quote}
                            onSave={(val) => updateField("quote", val)}
                            isAdmin={true}
                            multiline={true}
                            className="text-[30px] leading-[34px] tracking-[-0.7px] text-[#006D77] font-lora bg-white/50 border-b border-[#006D77]/30 px-2 py-1"
                        />
                    ) : (
                        <p
                            className="text-[#006D77] font-lora"
                            style={{
                                fontSize: '30px',
                                lineHeight: '34px',
                                letterSpacing: '-0.7px'
                            }}
                        >
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
                    style={{ marginTop: '40px' }}
                >
                    {isEditMode ? (
                        <EditableText
                            value={attribution}
                            onSave={(val) => updateField("attribution", val)}
                            isAdmin={true}
                            className="text-[15px] leading-[26px] text-[#006D77] font-figtree bg-white/50 border-b border-[#006D77]/30 px-2 py-1"
                        />
                    ) : (
                        <p
                            className="text-[#006D77] font-figtree"
                            style={{
                                fontSize: '15px',
                                lineHeight: '26px'
                            }}
                        >
                            {attribution}
                        </p>
                    )}
                </motion.div>
            </div>
        </section>
    );
}
