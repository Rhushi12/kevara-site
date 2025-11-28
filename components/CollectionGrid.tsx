"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const COLLECTIONS = [
    {
        id: 1,
        title: "Women's Resort",
        link: "/collections/women",
        image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1000&auto=format&fit=crop",
        size: "tall", // Left column
    },
    {
        id: 2,
        title: "Men's Casual",
        link: "/collections/men",
        image: "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?q=80&w=1000&auto=format&fit=crop",
        size: "wide", // Right top
    },
    {
        id: 3,
        title: "Home Essentials",
        link: "/collections/home",
        image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1000&auto=format&fit=crop",
        size: "wide", // Right bottom
    },
];

export default function CollectionGrid() {
    return (
        <section className="py-24 bg-[#FDFBF7]">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-sm font-bold tracking-[0.2em] text-[#006D77] uppercase mb-4">
                        Spring Summer 25'
                    </h2>
                    <h3 className="text-4xl md:text-5xl font-lora text-slate-900">
                        Home Sanctuary
                    </h3>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto h-auto md:h-[800px]">
                    {/* Left Column - Tall Item */}
                    {/* Left Column - Tall Item - Slide from Left */}
                    <motion.div
                        initial={{ x: -100, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="w-full h-[500px] md:h-full"
                    >
                        <Link
                            href={COLLECTIONS[0].link}
                            className="group relative block w-full h-full overflow-hidden rounded-lg"
                        >
                            <Image
                                src={COLLECTIONS[0].image}
                                alt={COLLECTIONS[0].title}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <h4 className="text-2xl md:text-3xl font-lora text-white mb-2 drop-shadow-md">
                                        {COLLECTIONS[0].title}
                                    </h4>
                                    <span className="inline-block text-xs font-bold tracking-widest text-white uppercase border-b-2 border-transparent group-hover:border-white transition-all duration-300 pb-1">
                                        Shop Now
                                    </span>
                                </div>
                            </div>
                        </Link>
                    </motion.div>

                    {/* Right Column - Stacked Items */}
                    {/* Right Column - Stacked Items */}
                    <div className="flex flex-col gap-6 h-full">
                        {/* Top Right - Slide from Right */}
                        <motion.div
                            initial={{ x: 100, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                            className="w-full h-[400px] md:h-1/2"
                        >
                            <Link
                                href={COLLECTIONS[1].link}
                                className="group relative block w-full h-full overflow-hidden rounded-lg"
                            >
                                <Image
                                    src={COLLECTIONS[1].image}
                                    alt={COLLECTIONS[1].title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <h4 className="text-2xl md:text-3xl font-lora text-white mb-2 drop-shadow-md">
                                            {COLLECTIONS[1].title}
                                        </h4>
                                        <span className="inline-block text-xs font-bold tracking-widest text-white uppercase border-b-2 border-transparent group-hover:border-white transition-all duration-300 pb-1">
                                            Shop Now
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>

                        {/* Bottom Right - Slide from Right */}
                        <motion.div
                            initial={{ x: 100, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
                            className="w-full h-[400px] md:h-1/2"
                        >
                            <Link
                                href={COLLECTIONS[2].link}
                                className="group relative block w-full h-full overflow-hidden rounded-lg"
                            >
                                <Image
                                    src={COLLECTIONS[2].image}
                                    alt={COLLECTIONS[2].title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <h4 className="text-2xl md:text-3xl font-lora text-white mb-2 drop-shadow-md">
                                            {COLLECTIONS[2].title}
                                        </h4>
                                        <span className="inline-block text-xs font-bold tracking-widest text-white uppercase border-b-2 border-transparent group-hover:border-white transition-all duration-300 pb-1">
                                            Shop Now
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
