import { useRouter } from "next/navigation";
import { LayoutDashboard, Users, UserPlus, FileText, Share2, Package, Settings, LogOut, Warehouse, ShoppingCart } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

export default function AdminSidebar({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) {
    const router = useRouter();
    const { logout } = useAuth();

    const menuItems = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "orders", label: "Orders", icon: ShoppingCart },
        { id: "leads", label: "Users & Accounts", icon: Users },
        { id: "wholesale", label: "Wholesale Inquiries", icon: UserPlus },
        { id: "cms", label: "Content Editor", icon: FileText },
        { id: "seo", label: "SEO & Social", icon: Share2 },
        { id: "products", label: "Product Manager", icon: Package },
        { id: "inventory", label: "Inventory", icon: Warehouse },
        { id: "settings", label: "Settings", icon: Settings },
    ];

    return (
        <aside className="fixed inset-y-0 left-0 bg-white border-r border-gray-100 flex flex-col flex-shrink-0 z-50 transition-all duration-300 ease-in-out w-[72px] hover:w-64 group/sidebar overflow-hidden shadow-sm">
            {/* Header/Logo */}
            <div className="h-20 border-b border-gray-100 flex items-center justify-center group-hover/sidebar:justify-start group-hover/sidebar:px-6 transition-all shrink-0">
                <div className="flex flex-col items-center group-hover/sidebar:items-start opacity-0 group-hover/sidebar:opacity-100 w-0 group-hover/sidebar:w-auto transition-all duration-200 overflow-hidden whitespace-nowrap">
                    <span className="font-geist font-bold tracking-widest uppercase text-xs text-slate-400 block mb-1">Kevara</span>
                    <span className="font-lora text-xl text-slate-900 leading-none">Workspace</span>
                </div>
                {/* Collapsed Icon */}
                <div className="group-hover/sidebar:hidden flex items-center justify-center w-full">
                    <span className="font-lora font-bold text-xl text-slate-900 leading-none">K</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="p-3 space-y-2 overflow-y-auto flex-grow overflow-x-hidden">
                <div className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4 ml-2 mt-2 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    Menu
                </div>
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group/btn relative overflow-hidden ${isActive
                                ? "bg-[#0E4D55] text-white shadow-sm"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                            title={item.label}
                        >
                            <div className="shrink-0 flex items-center justify-center w-6">
                                <Icon size={20} className={`${isActive ? "text-white" : "text-slate-400 group-hover/btn:text-[#0E4D55]"} transition-colors`} />
                            </div>
                            <span className="opacity-0 group-hover/sidebar:opacity-100 whitespace-nowrap transition-opacity duration-200 absolute left-12">
                                {item.label}
                            </span>
                        </button>
                    )
                })}
            </nav>

            {/* Footer / User Area */}
            <div className="p-4 border-t border-gray-100 shrink-0 overflow-x-hidden">
                <button
                    onClick={() => logout()}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors group/btn relative"
                    title="Logout"
                >
                    <div className="shrink-0 flex items-center justify-center w-6">
                        <LogOut size={20} className="text-slate-400 group-hover/btn:text-red-500 transition-colors" />
                    </div>
                    <span className="opacity-0 group-hover/sidebar:opacity-100 whitespace-nowrap transition-opacity duration-200 absolute left-12">
                        Logout
                    </span>
                </button>
            </div>
        </aside>
    );
}
