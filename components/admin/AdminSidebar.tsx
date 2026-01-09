export default function AdminSidebar({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) {
    const menuItems = [
        { id: "dashboard", label: "Dashboard" },
        { id: "leads", label: "Leads & Users" },
        { id: "wholesale", label: "Wholesale Inquiries" },
        { id: "cms", label: "Content Management" },
        { id: "seo", label: "SEO & Social" },
        { id: "products", label: "Product Catalog" }, // Placeholder
        { id: "settings", label: "Settings" }, // Placeholder
    ];

    return (
        <aside className="w-full md:w-64 bg-white border-r border-gray-100 flex-shrink-0 min-h-screen">
            <div className="p-6 border-b border-gray-100">
                <span className="font-lora font-bold text-xl text-[#0E4D55]">Kevara Admin</span>
            </div>
            <nav className="p-4 space-y-1">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors ${activeTab === item.id
                            ? "bg-[#0E4D55] text-white shadow-md shadow-[#0E4D55]/20"
                            : "text-gray-500 hover:bg-gray-50 hover:text-slate-900"
                            }`}
                    >
                        {item.label}
                    </button>
                ))}
            </nav>
        </aside>
    );
}
