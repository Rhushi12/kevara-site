"use client";

import { Facebook, Instagram, Twitter, Send } from "lucide-react";
import Link from "next/link";
import FooterFeatures from "@/components/FooterFeatures";

export default function Footer() {
    return (
        <footer className="bg-[#006D77] text-white">
            {/* Features Bar (Slider on Mobile) */}
            <FooterFeatures />

            {/* Main Footer Content */}
            <div className="container mx-auto px-4 py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
                    {/* Women Column (2 cols) */}
                    <div className="lg:col-span-2">
                        <h3 className="text-xs font-bold tracking-widest uppercase mb-6 text-white/90">Women</h3>
                        <ul className="space-y-3 text-sm text-gray-300 font-figtree">
                            <li><Link href="/collections/women-essentials" className="hover:text-white transition-colors">Essentials</Link></li>
                            <li><Link href="/collections/women-new" className="hover:text-white transition-colors">New Arrivals</Link></li>
                            <li><Link href="/collections/women-dresses" className="hover:text-white transition-colors">Dresses</Link></li>
                            <li><Link href="/collections/women-skirts" className="hover:text-white transition-colors">Skirts</Link></li>
                            <li><Link href="/women" className="hover:text-white transition-colors">View All</Link></li>
                        </ul>
                    </div>

                    {/* Men Column (2 cols) */}
                    <div className="lg:col-span-2">
                        <h3 className="text-xs font-bold tracking-widest uppercase mb-6 text-white/90">Men</h3>
                        <ul className="space-y-3 text-sm text-gray-300 font-figtree">
                            <li><Link href="/collections/men-essentials" className="hover:text-white transition-colors">Essentials</Link></li>
                            <li><Link href="/collections/men-new" className="hover:text-white transition-colors">New Arrivals</Link></li>
                            <li><Link href="/collections/men-shirts" className="hover:text-white transition-colors">Shirts</Link></li>
                            <li><Link href="/collections/men-shorts" className="hover:text-white transition-colors">Shorts</Link></li>
                            <li><Link href="/men" className="hover:text-white transition-colors">View All</Link></li>
                        </ul>
                    </div>

                    {/* About Column (2 cols) */}
                    <div className="lg:col-span-2">
                        <h3 className="text-xs font-bold tracking-widest uppercase mb-6 text-white/90">About</h3>
                        <ul className="space-y-3 text-sm text-gray-300 font-figtree">
                            <li><Link href="/about/story" className="hover:text-white transition-colors">Story</Link></li>
                            <li><Link href="/about/sustainability" className="hover:text-white transition-colors">Sustainability</Link></li>
                            <li><Link href="/about/care" className="hover:text-white transition-colors">Product Care</Link></li>
                            <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                            <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
                        </ul>
                    </div>

                    {/* Follow Us Column (2 cols) */}
                    <div className="lg:col-span-2">
                        <h3 className="text-xs font-bold tracking-widest uppercase mb-6 text-white/90">Follow Us</h3>
                        <div className="flex gap-3">
                            <Link href="#" className="w-10 h-10 border border-white/20 flex items-center justify-center hover:bg-white hover:text-[#006D77] transition-all rounded-sm">
                                <Facebook size={18} />
                            </Link>
                            <Link href="#" className="w-10 h-10 border border-white/20 flex items-center justify-center hover:bg-white hover:text-[#006D77] transition-all rounded-sm">
                                <Instagram size={18} />
                            </Link>
                        </div>
                    </div>

                    {/* Newsletter Column (4 cols) */}
                    <div className="lg:col-span-4 bg-white/5 p-6 rounded-lg border border-white/5">
                        <h3 className="text-xs font-bold tracking-widest uppercase mb-4 text-white/90">Newsletter</h3>
                        <p className="text-sm text-gray-300 mb-6 font-figtree leading-relaxed">
                            Subscribe to our newsletter and get a 10% discount on your first order. Be the first to know about new arrivals.
                        </p>
                        <form className="relative">
                            <input
                                type="email"
                                placeholder="Your e-mail"
                                className="w-full bg-white/10 border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:border-white/30 focus:bg-white/20 transition-all"
                            />
                            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors">
                                <Send size={16} />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/10 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6 text-xs text-gray-400">
                        <span>&copy; {new Date().getFullYear()} Kevara. All rights reserved.</span>
                        <span className="hidden md:inline text-white/20">|</span>
                        <span>Powered by Shopify</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">We accept</span>
                        <div className="flex gap-1.5">
                            {['Visa', 'Mastercard', 'Amex', 'PayPal'].map((card) => (
                                <div key={card} className="h-6 px-2 bg-white rounded-sm flex items-center justify-center shadow-sm opacity-90 hover:opacity-100 transition-opacity cursor-default">
                                    <span className="text-[8px] text-slate-900 font-bold uppercase tracking-tighter">{card}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
