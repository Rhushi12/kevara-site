"use client";

import { useEffect, useState } from "react";

interface LoadingBarProps {
    isLoading: boolean;
    onComplete?: () => void;
}

export default function LoadingBar({ isLoading, onComplete }: LoadingBarProps) {
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isLoading) {
            setVisible(true);
            setProgress(0);

            // Fast initial progress
            const timer1 = setTimeout(() => setProgress(30), 50);
            const timer2 = setTimeout(() => setProgress(60), 150);
            const timer3 = setTimeout(() => setProgress(80), 250);
            const timer4 = setTimeout(() => {
                setProgress(100);
                // After reaching 100%, trigger complete and fade out
                setTimeout(() => {
                    onComplete?.();
                    setTimeout(() => {
                        setVisible(false);
                        setProgress(0);
                    }, 200);
                }, 100);
            }, 350);

            return () => {
                clearTimeout(timer1);
                clearTimeout(timer2);
                clearTimeout(timer3);
                clearTimeout(timer4);
            };
        }
    }, [isLoading, onComplete]);

    if (!visible) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] bg-transparent">
            <div
                className="h-full bg-gradient-to-r from-[#006D77] via-[#83C5BE] to-[#006D77] transition-all duration-200 ease-out"
                style={{
                    width: `${progress}%`,
                    boxShadow: progress > 0 ? "0 0 10px rgba(0, 109, 119, 0.5)" : "none",
                    opacity: progress === 100 ? 0 : 1,
                    transition: progress === 100
                        ? "width 0.2s ease-out, opacity 0.3s ease-out"
                        : "width 0.2s ease-out"
                }}
            />
        </div>
    );
}
