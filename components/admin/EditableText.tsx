"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface EditableTextProps {
    value: string;
    onSave: (newValue: string) => void;
    isAdmin: boolean;
    className?: string;
    as?: "span" | "h1" | "h2" | "h3" | "p" | "div";
    placeholder?: string;
}

export default function EditableText({
    value,
    onSave,
    isAdmin,
    className,
    as: Component = "span",
    placeholder,
}: EditableTextProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value || "");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTempValue(value || "");
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleSave = () => {
        setIsEditing(false);
        if (tempValue.trim() !== value) {
            onSave(tempValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSave();
        } else if (e.key === "Escape") {
            setIsEditing(false);
            setTempValue(value);
        }
    };

    if (isAdmin && isEditing) {
        return (
            <input
                ref={inputRef}
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className={cn(
                    "bg-white text-black border border-[#006D77] rounded px-1 outline-none min-w-[50px] font-inherit",
                    className
                )}
                onClick={(e) => e.stopPropagation()} // Prevent triggering parent clicks
            />
        );
    }

    return (
        <Component
            onClick={(e: React.MouseEvent) => {
                if (isAdmin) {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsEditing(true);
                }
            }}
            className={cn(
                isAdmin && "cursor-pointer hover:bg-[#006D77]/10 hover:outline hover:outline-1 hover:outline-[#006D77] rounded px-0.5 transition-colors",
                className
            )}
        >
            {value || (isAdmin && placeholder ? <span className="text-gray-400 italic">{placeholder}</span> : value)}
        </Component>
    );
}
