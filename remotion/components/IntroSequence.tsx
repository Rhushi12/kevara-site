import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

export const IntroSequence: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Spring animation for text entrance
    const titleScale = spring({
        frame,
        fps,
        config: { damping: 12, stiffness: 100, mass: 0.8 },
    });

    const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
        extrapolateRight: "clamp",
    });

    const subtitleOpacity = interpolate(frame, [30, 50], [0, 1], {
        extrapolateRight: "clamp",
    });

    const subtitleY = interpolate(frame, [30, 60], [40, 0], {
        extrapolateRight: "clamp",
    });

    // Shimmer effect position
    const shimmerX = interpolate(frame, [0, 90], [-100, 200], {
        extrapolateRight: "clamp",
    });

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
            }}
        >
            {/* Main Title */}
            <div
                style={{
                    transform: `scale(${titleScale})`,
                    opacity: titleOpacity,
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                <h1
                    style={{
                        fontSize: 90,
                        fontWeight: 800,
                        color: "#fff",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        margin: 0,
                        textAlign: "center",
                        textShadow: "0 4px 30px rgba(255,255,255,0.2)",
                    }}
                >
                    Kevara
                </h1>
                {/* Shimmer overlay */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: `${shimmerX}%`,
                        width: "50%",
                        height: "100%",
                        background:
                            "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                        transform: "skewX(-20deg)",
                    }}
                />
            </div>

            {/* Subtitle */}
            <div
                style={{
                    opacity: subtitleOpacity,
                    transform: `translateY(${subtitleY}px)`,
                    marginTop: 30,
                }}
            >
                <p
                    style={{
                        fontSize: 36,
                        fontWeight: 400,
                        color: "rgba(255,255,255,0.85)",
                        letterSpacing: "0.3em",
                        textTransform: "uppercase",
                        margin: 0,
                    }}
                >
                    Spring Collection
                </p>
            </div>

            {/* Decorative lines */}
            <div
                style={{
                    position: "absolute",
                    bottom: 200,
                    display: "flex",
                    gap: 20,
                }}
            >
                {[0, 1, 2].map((i) => {
                    const lineWidth = spring({
                        frame: frame - i * 10,
                        fps,
                        config: { damping: 15, stiffness: 80 },
                    });
                    return (
                        <div
                            key={i}
                            style={{
                                width: interpolate(lineWidth, [0, 1], [0, 80]),
                                height: 3,
                                backgroundColor: "rgba(255,255,255,0.5)",
                                borderRadius: 2,
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
};
