"use client";

import { Facebook, Instagram, Twitter } from "lucide-react";
import Link from "next/link";
import LiquidButton from "@/components/ui/LiquidButton";

export default function Footer() {
    return (
        <footer className="bg-deep-teal text-white pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Column */}
                    <div>
                        <Link href="/" className="inline-block mb-6">
                            <h2 className="text-3xl font-lora font-bold tracking-tight">Kevara.</h2>
                        </Link>
                        <p className="text-gray-300 font-figtree mb-6 leading-relaxed">
                            Elevating everyday elegance with premium fabrics and timeless designs.
                            Crafted for the modern individual.
                        </p>
                        <div className="flex gap-4">
                            <Link href="#" className="hover:text-warm-cream transition-colors">
                                <Instagram size={20} />
                            </Link>
                            <Link href="#" className="hover:text-warm-cream transition-colors">
                                <Facebook size={20} />
                            </Link>
                            <Link href="#" className="hover:text-warm-cream transition-colors">
                                <Twitter size={20} />
                            </Link>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-lora font-bold mb-6">Shop</h3>
                        <ul className="space-y-3 font-figtree text-sm text-gray-300">
                            <li>
                                <Link href="#" className="hover:text-white transition-colors">
                                    New Arrivals
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-white transition-colors">
                                    Best Sellers
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-white transition-colors">
                                    Clothing
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-white transition-colors">
                                    Accessories
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="text-lg font-lora font-bold mb-6">Support</h3>
                        <ul className="space-y-3 font-figtree text-sm text-gray-300">
                            <li>
                                <Link href="#" className="hover:text-white transition-colors">
                                    Contact Us
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-white transition-colors">
                                    Shipping & Returns
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-white transition-colors">
                                    Size Guide
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-white transition-colors">
                                    FAQ
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h3 className="text-lg font-lora font-bold mb-6">Stay Updated</h3>
                        <p className="text-gray-300 font-figtree mb-4 text-sm">
                            Subscribe to our newsletter for exclusive offers and style tips.
                        </p>
                        <form className="flex flex-col gap-3">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="bg-white/10 border border-white/20 rounded px-4 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:border-white transition-colors"
                            />
                            <LiquidButton
                                type="button"
                                className="bg-white text-deep-teal font-medium py-2 rounded hover:bg-white border-none"
                                variant="secondary"
                            >
                                Subscribe
                            </LiquidButton>
                        </form>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-white/10 pt-8 text-center text-xs text-gray-400 font-figtree">
                    <p>&copy; {new Date().getFullYear()} Kevara. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
