"use client";

import { Facebook, Instagram, Twitter, Truck, Headphones, Lock, Send } from "lucide-react";
import Link from "next/link";
import LiquidButton from "@/components/ui/LiquidButton";

export default function Footer() {
    return (
        <footer className="bg-[#006D77] text-white">
            {/* Top Service Bar */}
            <div className="border-b border-white/10">
                <div className="container mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                        <div className="flex flex-col items-center gap-3">
                            <Truck size={24} className="text-white" />
                            <h4 className="text-xs font-bold tracking-widest uppercase">Free Shipping</h4>
                            <p className="text-xs text-gray-300 font-light max-w-[200px]">
                                Free worldwide shipping and returns - customs and duties taxes included
                            </p>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <Headphones size={24} className="text-white" />
                            <h4 className="text-xs font-bold tracking-widest uppercase">Customer Service</h4>
                            <p className="text-xs text-gray-300 font-light max-w-[200px]">
                                We are available from monday to friday to answer your questions.
                            </p>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <Lock size={24} className="text-white" />
                            <h4 className="text-xs font-bold tracking-widest uppercase">Secure Payment</h4>
                            <p className="text-xs text-gray-300 font-light max-w-[200px]">
                                Your payment information is processed securely.
                            </p>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <Send size={24} className="text-white" />
                            <h4 className="text-xs font-bold tracking-widest uppercase">Contact Us</h4>
                            <p className="text-xs text-gray-300 font-light max-w-[200px]">
                                Need to contact us? Just send us an e-mail at info@kevara.com
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Footer Content */}
            <div className="container mx-auto px-4 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
                    {/* Women Column */}
                    <div>
                        <h3 className="text-xs font-bold tracking-widest uppercase mb-6">Women</h3>
                        <ul className="space-y-3 text-sm text-gray-300 font-figtree">
                            <li><Link href="/collections/women-essentials" className="hover:text-white transition-colors">Essentials</Link></li>
                            <li><Link href="/collections/women-new" className="hover:text-white transition-colors">New Arrivals</Link></li>
                            <li><Link href="/collections/women-dresses" className="hover:text-white transition-colors">Dresses</Link></li>
                            <li><Link href="/collections/women-skirts" className="hover:text-white transition-colors">Skirts</Link></li>
                            <li><Link href="/women" className="hover:text-white transition-colors">View All</Link></li>
                        </ul>
                    </div>

                    {/* Men Column */}
                    <div>
                        <h3 className="text-xs font-bold tracking-widest uppercase mb-6">Men</h3>
                        <ul className="space-y-3 text-sm text-gray-300 font-figtree">
                            <li><Link href="/collections/men-essentials" className="hover:text-white transition-colors">Essentials</Link></li>
                            <li><Link href="/collections/men-new" className="hover:text-white transition-colors">New Arrivals</Link></li>
                            <li><Link href="/collections/men-shirts" className="hover:text-white transition-colors">Shirts</Link></li>
                            <li><Link href="/collections/men-shorts" className="hover:text-white transition-colors">Shorts</Link></li>
                            <li><Link href="/men" className="hover:text-white transition-colors">View All</Link></li>
                        </ul>
                    </div>

                    {/* About Column */}
                    <div>
                        <h3 className="text-xs font-bold tracking-widest uppercase mb-6">About</h3>
                        <ul className="space-y-3 text-sm text-gray-300 font-figtree">
                            <li><Link href="/about/story" className="hover:text-white transition-colors">Story</Link></li>
                            <li><Link href="/about/sustainability" className="hover:text-white transition-colors">Sustainability</Link></li>
                            <li><Link href="/about/care" className="hover:text-white transition-colors">Product Care</Link></li>
                            <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                            <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
                        </ul>
                    </div>

                    {/* Follow Us Column */}
                    <div>
                        <h3 className="text-xs font-bold tracking-widest uppercase mb-6">Follow Us</h3>
                        <div className="flex gap-4">
                            <Link href="#" className="w-10 h-10 border border-white/20 flex items-center justify-center hover:bg-white hover:text-[#006D77] transition-all rounded-sm">
                                <Facebook size={18} />
                            </Link>
                            <Link href="#" className="w-10 h-10 border border-white/20 flex items-center justify-center hover:bg-white hover:text-[#006D77] transition-all rounded-sm">
                                <Instagram size={18} />
                            </Link>
                        </div>
                    </div>

                    {/* Newsletter Column */}
                    <div className="lg:col-span-1">
                        <h3 className="text-xs font-bold tracking-widest uppercase mb-6">Newsletter</h3>
                        <p className="text-sm text-gray-300 mb-4 font-figtree">
                            Subscribe to our newsletter and get a 10% discount on your first order.
                        </p>
                        <form className="relative">
                            <input
                                type="email"
                                placeholder="Your e-mail"
                                className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:border-white/30 transition-colors"
                            />
                            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-white hover:text-gray-300">
                                <Send size={16} />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/10 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>United States (USD $)</span>
                        <span>Kevara Theme Ivory</span>
                        <span>Powered by Shopify</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 mr-2">We accept</span>
                        {/* Payment Icons Placeholders */}
                        <div className="flex gap-1">
                            {['Visa', 'Mastercard', 'Amex', 'PayPal'].map((card) => (
                                <div key={card} className="w-8 h-5 bg-white rounded-sm flex items-center justify-center">
                                    <span className="text-[6px] text-slate-900 font-bold">{card}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
