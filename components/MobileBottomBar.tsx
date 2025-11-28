"use client";

import { Home, Search, ShoppingBag, User } from "lucide-react";
import { useState } from "react";

export default function MobileBottomBar() {
    const [activeTab, setActiveTab] = useState("home");

    const navItems = [
        { id: "home", icon: Home, label: "Home" },
        { id: "search", icon: Search, label: "Search" },
        { id: "cart", icon: ShoppingBag, label: "Cart" },
        { id: "account", icon: User, label: "Account" },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-6 md:hidden z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex flex-col items-center gap-1 transition-colors duration-200 ${isActive ? "text-deep-teal" : "text-gray-400 hover:text-gray-600"
                                }`}
                        >
                            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-medium font-figtree">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
