import { useRouter } from "next/navigation";
import { LayoutDashboard, Users, UserPlus, Network, Share2, Package, Settings, LogOut, Warehouse, ShoppingCart, Truck } from "lucide-react";
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
        { id: "cms", label: "Content View", icon: Network },
        { id: "seo", label: "SEO & Social", icon: Share2 },
        { id: "products", label: "Product Manager", icon: Package },
        { id: "inventory", label: "Inventory", icon: Warehouse },
        { id: "logistics", label: "Logistics & Delhivery", icon: Truck },
        { id: "settings", label: "Settings", icon: Settings },
    ];

    return (
        <aside className="fixed inset-y-0 left-0 bg-[#FDFBF7] border-r border-[#006D77]/10 flex flex-col flex-shrink-0 z-50 transition-all duration-300 ease-in-out w-[72px] hover:w-64 group/sidebar overflow-hidden shadow-sm">
            {/* Header/Logo */}
            <div className="h-20 border-b border-[#006D77]/10 flex items-center justify-center group-hover/sidebar:justify-start group-hover/sidebar:px-6 transition-all shrink-0">
                <div className="flex flex-col items-center group-hover/sidebar:items-start opacity-0 group-hover/sidebar:opacity-100 w-0 group-hover/sidebar:w-auto transition-all duration-200 overflow-hidden whitespace-nowrap">
                    <span className="font-prata font-bold tracking-widest uppercase text-[10px] text-slate-400 block mb-1">Kevara</span>
                    <span className="font-lora text-lg text-slate-900 leading-none">Workspace</span>
                </div>
                {/* Collapsed Icon */}
                <div className="group-hover/sidebar:hidden flex items-center justify-center w-full">
                    <span className="font-prata font-bold text-xl text-[#006D77] leading-none">K</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="p-2 space-y-1 overflow-y-auto flex-grow overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]">
                <div className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-4 ml-6 mt-4 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    Menu
                </div>
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-4 p-3 rounded-none text-sm font-medium transition-all duration-200 group/btn relative overflow-hidden ${isActive
                                ? "bg-[#006D77]/5 border-r-2 border-[#006D77] text-[#006D77]"
                                : "text-slate-500 hover:bg-[#006D77]/5 hover:text-[#006D77] border-r-2 border-transparent"
                                }`}
                            title={item.label}
                        >
                            <div className="shrink-0 flex items-center justify-center w-8">
                                <Icon size={20} className={`${isActive ? "text-[#006D77]" : "text-slate-400 group-hover/btn:text-[#006D77]"} transition-colors`} />
                            </div>
                            <span className="opacity-0 group-hover/sidebar:opacity-100 whitespace-nowrap transition-opacity duration-200 absolute left-[56px] font-prata text-base">
                                {item.label}
                            </span>
                        </button>
                    )
                })}
            </nav>

            {/* Footer / User Area */}
            <div className="p-2 border-t border-[#006D77]/10 shrink-0 overflow-x-hidden">
                <button
                    onClick={() => logout()}
                    className="w-full flex items-center gap-4 p-3 rounded-none text-sm font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 border-r-2 border-transparent hover:border-rose-600 transition-colors group/btn relative"
                    title="Logout"
                >
                    <div className="shrink-0 flex items-center justify-center w-8">
                        <LogOut size={20} className="text-slate-400 group-hover/btn:text-rose-500 transition-colors" />
                    </div>
                    <span className="opacity-0 group-hover/sidebar:opacity-100 whitespace-nowrap transition-opacity duration-200 absolute left-[56px] font-prata text-base">
                        Logout
                    </span>
                </button>
            </div>
        </aside>
    );
}
