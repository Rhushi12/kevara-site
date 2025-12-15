"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

// FAQ Content Structure
const FAQ_CATEGORIES = [
    {
        id: 'shopping',
        title: 'Shopping Information',
        questions: [
            {
                q: "Do I need an account to place an order?",
                a: "No, you can shop as a guest. However, creating an account allows you to track your orders, save your wishlist, and checkout faster for future purchases."
            },
            {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards (Visa, Mastercard, American Express) and PayPal. All payments are processed securely."
            },
            {
                q: "How can I track my order?",
                a: "Once your order has shipped, you will receive an email verification containing a tracking number that you can use to follow your package."
            }
        ]
    },
    {
        id: 'shipping',
        title: 'Shipping & Returns',
        questions: [
            {
                q: "Do you ship worldwide?",
                a: "Yes, we ship to over 50 countries. Shipping costs and delivery times vary by location and are calculated at checkout."
            },
            {
                q: "What is your return policy?",
                a: "We offer a 30-day return policy for all unworn items in their original condition with tags attached. Please visit our Returns portal to initiate a return."
            },
            {
                q: "How long does delivery take?",
                a: "Domestic orders typically arrive within 3-5 business days. International shipping can take 7-14 business days depending on customs processing."
            }
        ]
    },
    {
        id: 'products',
        title: 'Product & Care',
        questions: [
            {
                q: "Where serve your products made?",
                a: "Our collections are designed in-house and ethically crafted by skilled artisans in Portugal and Italy, ensuring the highest quality standards."
            },
            {
                q: "How do I care for my garments?",
                a: "Each item comes with a specific care label. Generally, we recommend gentle hand washing or dry cleaning for our premium fabrics to ensure longevity."
            }
        ]
    }
];

export default function FaqPageContent() {
    const [activeSection, setActiveSection] = useState('shopping');
    const [openQuestion, setOpenQuestion] = useState<string | null>(null);
    const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

    // Scroll Spy Logic
    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 100; // Offset

            FAQ_CATEGORIES.forEach((cat) => {
                const element = sectionRefs.current[cat.id];
                if (element) {
                    const { offsetTop, offsetHeight } = element;
                    if (
                        scrollPosition >= offsetTop &&
                        scrollPosition < offsetTop + offsetHeight
                    ) {
                        setActiveSection(cat.id);
                    }
                }
            });
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        const element = sectionRefs.current[id];
        if (element) {
            window.scrollTo({
                top: element.offsetTop - 80,
                behavior: 'smooth'
            });
            setActiveSection(id);
        }
    };

    const toggleQuestion = (q: string) => {
        setOpenQuestion(openQuestion === q ? null : q);
    };

    return (
        <main className="min-h-screen bg-[#FDFBF7]">
            <Navbar />
            {/* Header */}
            <section className="pt-32 pb-12 md:pt-40 md:pb-16 px-4 text-center bg-warm-cream border-b border-[#EBE6DD]">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-4xl md:text-5xl font-lora text-[#003840] mb-4"
                >
                    Frequently Asked Questions
                </motion.h1>
                <div className="w-16 h-1 bg-[#003840] mx-auto mb-6 opacity-20"></div>
                <p className="text-sm md:text-base font-figtree text-slate-600 max-w-2xl mx-auto">
                    Everything you need to know about our products and services.
                </p>
            </section>

            {/* Main Content with Sticky Sidebar */}
            <div className="container mx-auto px-4 py-16 md:py-24">
                <div className="flex flex-col md:flex-row gap-12 lg:gap-24 relative items-start">

                    {/* Sticky Sidebar (Progress Bar) */}
                    <aside className="hidden md:block w-1/4 sticky top-32 self-start">
                        <div className="relative pl-6 border-l border-gray-200 py-2">
                            {/* Animated Active Indicator Line */}
                            <motion.div
                                layoutId="activeIndicator"
                                className="absolute left-[-1.5px] w-[3px] bg-[#003840] rounded-full"
                                initial={false}
                                animate={{
                                    top: (FAQ_CATEGORIES.findIndex(c => c.id === activeSection) * 44 + 8) + 'px', // Adjusted offset
                                    height: '24px'
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />

                            <nav className="space-y-6">
                                {FAQ_CATEGORIES.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => scrollToSection(cat.id)}
                                        className={`block text-left text-sm font-figtree tracking-wide transition-colors duration-300 ${activeSection === cat.id
                                            ? 'text-[#003840] font-bold'
                                            : 'text-slate-400 hover:text-slate-600'
                                            }`}
                                        style={{ height: '24px', lineHeight: '24px' }}
                                    >
                                        {cat.title}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </aside>

                    {/* FAQ Vertical Content */}
                    <div className="md:w-3/4 space-y-20">
                        {FAQ_CATEGORIES.map((cat) => (
                            <section
                                key={cat.id}
                                id={cat.id}
                                ref={(el: any) => (sectionRefs.current[cat.id] = el)}
                                className="scroll-mt-40"
                            >
                                <h2 className="text-2xl md:text-3xl font-lora text-slate-900 mb-8 pb-4 border-b border-gray-100 flex items-center gap-4">
                                    <span className="text-[#003840]/20 text-4xl block font-serif italic">
                                        {cat.id === 'shopping' ? '01' : cat.id === 'shipping' ? '02' : '03'}
                                    </span>
                                    {cat.title}
                                </h2>

                                <div className="space-y-4">
                                    {cat.questions.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-white border border-[#EBE6DD] rounded-sm overflow-hidden hover:shadow-sm transition-shadow"
                                        >
                                            <button
                                                onClick={() => toggleQuestion(item.q)}
                                                className="w-full flex items-center justify-between p-6 text-left"
                                            >
                                                <span className="font-lora text-lg text-slate-800 pr-8">{item.q}</span>
                                                <span className={`text-[#003840] transition-transform duration-300 ${openQuestion === item.q ? 'rotate-180' : ''}`}>
                                                    {openQuestion === item.q ? <Minus size={18} /> : <Plus size={18} />}
                                                </span>
                                            </button>
                                            <AnimatePresence>
                                                {openQuestion === item.q && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                                    >
                                                        <div className="px-6 pb-6 pt-0 text-sm font-figtree leading-relaxed text-slate-600">
                                                            {item.a}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>

                </div>
            </div>

            {/* Still have questions? */}
            <section className="py-20 bg-white border-t border-[#EBE6DD] text-center">
                <div className="container mx-auto px-4">
                    <h2 className="text-2xl font-lora text-slate-900 mb-4">Still have questions?</h2>
                    <p className="text-slate-500 mb-8 max-w-lg mx-auto font-figtree">
                        We're here to help. Contact our friendly support team for any inquiries.
                    </p>
                    <Link
                        href="/contact"
                        className="inline-block px-8 py-3 bg-[#003840] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#00282e] transition-colors rounded-sm"
                    >
                        Contact Us
                    </Link>
                </div>
            </section>

            <Footer />
        </main>
    );
}
