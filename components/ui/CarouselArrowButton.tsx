import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CarouselArrowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    direction: "left" | "right";
    className?: string;
}

export default function CarouselArrowButton({ direction, className, ...props }: CarouselArrowButtonProps) {
    const isLeft = direction === "left";
    const Icon = isLeft ? ArrowLeft : ArrowRight;

    return (
        <button
            className={cn(
                "group/btn relative flex items-center justify-center w-12 h-12 bg-white border border-gray-200 shadow-sm transition-all duration-300 hover:border-gray-400 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden",
                className
            )}
            {...props}
        >
            <div className="relative w-full h-full flex items-center justify-center">
                {/* Primary Icon - Exits on hover */}
                <Icon
                    size={20}
                    className={cn(
                        "absolute text-slate-900 transition-transform duration-300 ease-in-out",
                        isLeft
                            ? "group-hover/btn:-translate-x-[150%]"
                            : "group-hover/btn:translate-x-[150%]"
                    )}
                />

                {/* Secondary Icon - Enters on hover */}
                <Icon
                    size={20}
                    className={cn(
                        "absolute text-slate-900 transition-transform duration-300 ease-in-out",
                        isLeft
                            ? "translate-x-[150%] group-hover/btn:translate-x-0"
                            : "-translate-x-[150%] group-hover/btn:translate-x-0"
                    )}
                />
            </div>
        </button>
    );
}
