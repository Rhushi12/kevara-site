import { ImagePlus } from "lucide-react";

interface PlaceholderImageProps {
    onClick: () => void;
    label?: string;
    className?: string;
}

export default function PlaceholderImage({ onClick, label = "Click to Add Image", className = "" }: PlaceholderImageProps) {
    return (
        <div
            onClick={onClick}
            className={`flex flex-col items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 text-gray-400 hover:bg-gray-50 hover:border-[#006D77] hover:text-[#006D77] transition-all cursor-pointer group ${className}`}
        >
            <ImagePlus size={48} className="mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
            <span className="font-medium text-sm uppercase tracking-wide">{label}</span>
        </div>
    );
}
