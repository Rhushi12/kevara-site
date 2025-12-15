"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, Phone } from 'lucide-react';
import EssentialsHero from '@/components/EssentialsHero';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

// Types for our Metaobject Data
interface ContactPageData {
    hero_title?: string;
    hero_subtitle?: string;
    hero_image?: string;
    form_title?: string;
    form_subtitle?: string;
    info_cards?: {
        title: string;
        email: string;
    }[];
}

const DEFAULT_DATA: ContactPageData = {
    hero_title: "Contact Us",
    hero_subtitle: "If you have any questions, you are always welcome to contact us. Choose a topic below to send us an e-mail or fill in the form. We will respond to you within 48 hours (from monday to friday).",
    hero_image: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0", // Vast Ocean
    // Alternative: "https://images.unsplash.com/photo-1589394815804-984bb120c85c"
    form_title: "Send a message",
    form_subtitle: "Just fill out the form below and we'll get back to you as soon as possible.",
    info_cards: [
        { title: "Customer Service", email: "customerservice@kevara.in" },
        { title: "Press", email: "press@kevara.in" },
        { title: "Wholesale", email: "wholesale@kevara.in" }
    ]
};

export default function ContactPageContent() {
    const [data, setData] = useState<ContactPageData>(DEFAULT_DATA);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                // Attempt to fetch from our API that handles metaobjects
                // If this page specific handle 'contact-us' exists
                const res = await fetch('/api/pages?handle=contact-us');
                if (res.ok) {
                    const fetchedData = await res.json();
                    if (fetchedData) {
                        // Map fetched data to our structure if needed, or use directly
                        // For now, assuming the structure matches or we blend it
                        setData(prev => ({ ...prev, ...fetchedData }));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch contact page data", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert("Thank you for your message! We will get back to you soon.");
    };

    return (
        <main className="min-h-screen bg-warm-cream">
            <Navbar />
            {/* 1. Hero Section */}
            <section className="relative h-[40vh] md:h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <Image
                        src={data.hero_image || DEFAULT_DATA.hero_image!}
                        alt="Contact Hero"
                        fill
                        className="object-cover brightness-[0.7]"
                        priority
                    />
                </div>
                <div className="relative z-10 container mx-auto px-4 text-center text-white">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-4xl md:text-6xl font-lora mb-4"
                    >
                        {data.hero_title}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="max-w-2xl mx-auto text-sm md:text-base font-figtree leading-relaxed text-white/90"
                    >
                        {data.hero_subtitle}
                    </motion.p>
                </div>
            </section>

            {/* 2. Contact Form Section */}
            <section className="py-16 md:py-24 bg-white">
                <div className="container mx-auto px-4 max-w-3xl text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-3xl md:text-4xl font-lora text-slate-900 mb-3">{data.form_title}</h2>
                        <p className="text-sm font-figtree text-slate-500 mb-12">{data.form_subtitle}</p>

                        <form onSubmit={handleSubmit} className="space-y-6 text-left">
                            <div>
                                <input
                                    type="text"
                                    placeholder="Name"
                                    className="w-full px-4 py-3 bg-white border border-gray-200 focus:border-[#006D77] outline-none transition-colors rounded-sm font-figtree text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <input
                                    type="email"
                                    placeholder="E-mail"
                                    className="w-full px-4 py-3 bg-white border border-gray-200 focus:border-[#006D77] outline-none transition-colors rounded-sm font-figtree text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <textarea
                                    placeholder="Message"
                                    rows={6}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 focus:border-[#006D77] outline-none transition-colors rounded-sm font-figtree text-sm resize-none"
                                    required
                                />
                            </div>

                            <div className="flex justify-center mt-8">
                                <button
                                    type="submit"
                                    className="px-12 py-3 bg-[#5C1919] text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#4a1414] transition-colors rounded-sm"
                                >
                                    Submit
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </section>

            {/* 3. Info Cards Section */}
            <section className="py-16 md:py-20 bg-warm-cream">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-center gap-6 md:gap-12">
                        {/* Email Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="bg-[#F5F2EC] p-10 text-center border border-[#EBE6DD] md:w-1/3"
                        >
                            <h3 className="text-xl font-lora text-[#5C1919] mb-4">Email Us</h3>
                            <a
                                href="mailto:info@kevara.in"
                                className="text-xs font-bold uppercase tracking-widest text-slate-600 border-b border-slate-300 pb-0.5 hover:text-[#5C1919] hover:border-[#5C1919] transition-all"
                            >
                                info@kevara.in
                            </a>
                        </motion.div>

                        {/* Social Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="bg-[#F5F2EC] p-10 text-center border border-[#EBE6DD] md:w-1/3"
                        >
                            <h3 className="text-xl font-lora text-[#5C1919] mb-4">Follow Us</h3>
                            <a
                                href="https://www.instagram.com/kevara.in?igsh=ZmUxaW12MDg2NTZ0"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-bold uppercase tracking-widest text-slate-600 border-b border-slate-300 pb-0.5 hover:text-[#5C1919] hover:border-[#5C1919] transition-all"
                            >
                                @kevara.in
                            </a>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 4. Essentials Promo (Reuse) */}
            <EssentialsHero />

            {/* 5. Footer */}
            <Footer />
        </main>
    );
}
