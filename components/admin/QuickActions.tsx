"use client";

import { ImagePlus, FileEdit, Settings2, Package } from "lucide-react";

interface QuickActionsProps {
    onNavigate?: (tab: string) => void;
}

export default function QuickActions({ onNavigate }: QuickActionsProps) {
    const actions = [
        {
            title: "Add New Product",
            description: "Create a new item in the catalog",
            icon: <ImagePlus size={18} className="text-emerald-600" />,
            bg: "bg-emerald-50 text-emerald-600",
            hover: "hover:border-emerald-200 hover:bg-emerald-50/50",
            tab: "products",
        },
        {
            title: "Manage Products",
            description: "View and edit all products",
            icon: <Package size={18} className="text-blue-600" />,
            bg: "bg-blue-50 text-blue-600",
            hover: "hover:border-blue-200 hover:bg-blue-50/50",
            tab: "products",
        },
        {
            title: "Edit Navigation",
            description: "Update site menu and links",
            icon: <FileEdit size={18} className="text-indigo-600" />,
            bg: "bg-indigo-50 text-indigo-600",
            hover: "hover:border-indigo-200 hover:bg-indigo-50/50",
            tab: "content",
        },
        {
            title: "Store Settings",
            description: "SEO, admins, and preferences",
            icon: <Settings2 size={18} className="text-slate-600" />,
            bg: "bg-slate-100 text-slate-600",
            hover: "hover:border-slate-300 hover:bg-slate-50/50",
            tab: "settings",
        },
    ];

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200/60 transition-shadow hover:shadow-md h-full flex flex-col">
            <h3 className="text-lg font-lora font-medium text-slate-900 tracking-tight mb-1">Quick Actions</h3>
            <p className="text-xs text-slate-500 font-medium mb-6">Common administrative tasks</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
                {actions.map((action, i) => (
                    <button
                        key={i}
                        onClick={() => onNavigate?.(action.tab)}
                        className={`flex flex-col items-center justify-center p-6 rounded-xl border border-slate-100 bg-white transition-all group cursor-pointer ${action.hover}`}
                    >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${action.bg}`}>
                            {action.icon}
                        </div>
                        <h4 className="text-sm font-semibold text-slate-900 text-center">{action.title}</h4>
                        <p className="text-[10px] text-slate-500 mt-1 text-center font-medium leading-tight">{action.description}</p>
                    </button>
                ))}
            </div>
        </div>
    );
}
