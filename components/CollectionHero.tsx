"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface CollectionHeroProps {
    title: string;
    image: string;
}

export default function CollectionHero({ title, image }: CollectionHeroProps) {
    return (
        <section className="relative h-[400px] w-full overflow-hidden">
            <Image
                src={image}
                alt={title}
                fill
                className="object-cover"
                priority
            />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-5xl md:text-7xl font-lora text-white text-center"
                >
                    {title}
                </motion.h1>
            </div>
        </section>
    );
}
