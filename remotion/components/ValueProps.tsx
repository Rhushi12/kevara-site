import React from "react";
import {
    useCurrentFrame,
    useVideoConfig,
    spring,
    interpolate,
} from "remotion";
import { BRAND } from "../data/products";

const VALUE_PROPS = [
    { title: "Premium Fabrics", icon: "🧵" },
    { title: "Timeless Design", icon: "✨" },
    { title: "Made for You", icon: "💜" },
];

export const ValueProps: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Each prop gets ~70 frames (~2.3 seconds)
    const propDuration = 70;

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                backgroundColor: BRAND.black,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Background gradient pulse */}
            <div
                style={{
                    position: "absolute",
                    width: "150%",
                    height: "150%",
                    background: `radial-gradient(ellipse at center, ${BRAND.gold}15 0%, transparent 60%)`,
                    opacity: interpolate(Math.sin(frame / 20), [-1, 1], [0.3, 0.6]),
                }}
            />

            {VALUE_PROPS.map((prop, index) => {
                const propFrame = frame - index * propDuration;
                const isVisible = propFrame >= -20 && propFrame <= propDuration + 20;

                if (!isVisible) return null;

                // Entry spring
                const entryProgress = spring({
                    frame: propFrame,
                    fps,
                    config: { damping: 15, stiffness: 100 },
                });

                // Exit fade
                const exitOpacity = interpolate(
                    propFrame,
                    [propDuration - 15, propDuration],
                    [1, 0],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                );

                const opacity = propFrame < 0 ? 0 : exitOpacity;
                const scale = interpolate(entryProgress, [0, 1], [0.8, 1]);
                const y = interpolate(entryProgress, [0, 1], [50, 0]);

                // Icon bounce
                const iconBounce = Math.sin((propFrame / 8) * Math.PI) * 5;

                return (
                    <div
                        key={index}
                        style={{
                            position: "absolute",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            opacity,
                            transform: `scale(${scale}) translateY(${y}px)`,
                        }}
                    >
                        {/* Icon */}
                        <div
                            style={{
                                fontSize: 120,
                                marginBottom: 40,
                                transform: `translateY(${iconBounce}px)`,
                                filter: `drop-shadow(0 0 30px ${BRAND.gold})`,
                            }}
                        >
                            {prop.icon}
                        </div>

                        {/* Title */}
                        <h2
                            style={{
                                fontSize: 72,
                                fontWeight: 700,
                                color: BRAND.white,
                                margin: 0,
                                fontFamily: "'Inter', sans-serif",
                                letterSpacing: "-0.02em",
                                textAlign: "center",
                            }}
                        >
                            {prop.title}
                        </h2>

                        {/* Underline */}
                        <div
                            style={{
                                width: interpolate(entryProgress, [0, 1], [0, 150]),
                                height: 4,
                                backgroundColor: BRAND.gold,
                                marginTop: 30,
                                borderRadius: 2,
                            }}
                        />
                    </div>
                );
            })}
        </div>
    );
};
