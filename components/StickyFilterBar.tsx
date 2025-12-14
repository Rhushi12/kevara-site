import { Filter, ChevronDown } from "lucide-react";

interface StickyFilterBarProps {
    onFilterClick: () => void;
    onSortClick: () => void;
}

export default function StickyFilterBar({ onFilterClick, onSortClick, visible = true }: StickyFilterBarProps & { visible?: boolean }) {
    return (
        <div
            className={`md:hidden sticky top-16 z-40 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between transition-transform duration-300 ${visible ? 'translate-y-0' : '-translate-y-[150%]'}`}
        >
            <button
                onClick={onFilterClick}
                className="flex-1 py-3.5 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-[#003840] border-r border-gray-100 hover:bg-gray-50 transition-colors"
                style={{ fontFamily: 'var(--font-figtree)' }}
            >
                <Filter size={14} className="opacity-70" />
                Filter
            </button>
            <button
                onClick={onSortClick}
                className="flex-1 py-3.5 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-[#003840] hover:bg-gray-50 transition-colors"
                style={{ fontFamily: 'var(--font-figtree)' }}
            >
                <ChevronDown size={14} className="opacity-70" />
                Sort By
            </button>
        </div>
    );
}
