"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LiquidButtonProps {
    children: React.ReactNode;
    href?: string;
    onClick?: React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
    className?: string;
    variant?: "primary" | "secondary";
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
}

export default function LiquidButton({
    children,
    href,
    onClick,
    className,
    variant = "primary",
    type = "button",
    disabled = false,
}: LiquidButtonProps) {
    const baseStyles =
        "relative overflow-hidden inline-flex items-center justify-center px-12 py-4 text-[13px] font-bold tracking-[0.2em] uppercase transition-colors duration-300 group rounded-sm";

    const variants = {
        primary: "bg-[#006D77] text-white",
        secondary: "bg-white text-slate-900 border border-slate-900",
    };

    const content = (
        <>
            <span className="relative z-10">{children}</span>
            <span className="absolute inset-0 bg-black/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out" />
        </>
    );

    if (href && !disabled) {
        return (
            <Link href={href} className={cn(baseStyles, variants[variant], className)}>
                {content}
            </Link>
        );
    }

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={cn(baseStyles, variants[variant], className, disabled && "opacity-50 cursor-not-allowed pointer-events-none")}
        >
            {content}
        </button>
    );
}
