"use client";

import { useState, useEffect, useRef, CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface EditableTextProps {
    value: string;
    onSave: (newValue: string) => void;
    isAdmin: boolean;
    className?: string;
    style?: CSSProperties;
    as?: "span" | "h1" | "h2" | "h3" | "p" | "div";
    multiline?: boolean;
    placeholder?: string;
}

export default function EditableText({
    value,
    onSave,
    isAdmin,
    className,
    style,
    as: Component = "span",
    placeholder,
    multiline = false,
}: EditableTextProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value || "");
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

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
            if (multiline) {
                if (e.ctrlKey || e.metaKey) {
                    // Ctrl+Enter or Cmd+Enter to save in multiline
                    e.preventDefault();
                    handleSave();
                }
                // Otherwise let Enter insert newline
            } else if (!e.shiftKey) {
                // In single line, Enter saves (unless Shift+Enter)
                e.preventDefault();
                handleSave();
            }
        } else if (e.key === "Escape") {
            setIsEditing(false);
            setTempValue(value);
        }
    };

    if (isAdmin && isEditing) {
        if (multiline) {
            return (
                <textarea
                    ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    className={cn(
                        "bg-white text-black border border-[#006D77] rounded px-1 outline-none min-w-[50px] font-inherit w-full",
                        className
                    )}
                    style={style}
                    onClick={(e) => e.stopPropagation()}
                    rows={4}
                />
            );
        }
        return (
            <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className={cn(
                    "bg-white text-black border border-[#006D77] rounded px-1 outline-none min-w-[50px] font-inherit",
                    className
                )}
                style={style}
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
            style={style}
        >
            {value || (isAdmin && placeholder ? <span className="text-gray-400 italic">{placeholder}</span> : value)}
        </Component>
    );
}
