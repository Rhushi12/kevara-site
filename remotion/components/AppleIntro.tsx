import React from "react";
import {
    useCurrentFrame,
    useVideoConfig,
    spring,
    interpolate,
    Img,
    staticFile,
} from "remotion";
import { BRAND } from "../data/products";

export const AppleIntro: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Logo fade and scale
    const logoOpacity = interpolate(frame, [0, 40], [0, 1], {
        extrapolateRight: "clamp",
    });

    const logoScale = spring({
        frame,
        fps,
        config: { damping: 15, stiffness: 80, mass: 1 },
    });

    // Logo glow pulse
    const glowIntensity = interpolate(
        Math.sin(frame / 15),
        [-1, 1],
        [0.3, 0.6]
    );

    // Tagline reveal (staggered)
    const taglineOpacity = interpolate(frame, [120, 160], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    const taglineY = interpolate(
        spring({ frame: frame - 120, fps, config: { damping: 12, stiffness: 100 } }),
        [0, 1],
        [30, 0]
    );

    // "Since 2018" text
    const sinceOpacity = interpolate(frame, [180, 220], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    // Decorative line animation
    const lineWidth = interpolate(frame, [80, 150], [0, 200], {
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
                backgroundColor: BRAND.black,
                position: "relative",
            }}
        >
            {/* Ambient background glow */}
            <div
                style={{
                    position: "absolute",
                    width: 600,
                    height: 600,
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${BRAND.gold}20 0%, transparent 70%)`,
                    opacity: glowIntensity,
                    filter: "blur(60px)",
                }}
            />

            {/* Logo */}
            <div
                style={{
                    opacity: logoOpacity,
                    transform: `scale(${logoScale})`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                <Img
                    src={staticFile("logo.png")}
                    style={{
                        width: 400,
                        height: "auto",
                        filter: `drop-shadow(0 0 ${30 * glowIntensity}px ${BRAND.gold})`,
                    }}
                />
            </div>

            {/* Decorative line */}
            <div
                style={{
                    width: lineWidth,
                    height: 2,
                    background: `linear-gradient(90deg, transparent, ${BRAND.gold}, transparent)`,
                    marginTop: 40,
                    opacity: interpolate(frame, [80, 120], [0, 0.6], {
                        extrapolateRight: "clamp",
                    }),
                }}
            />

            {/* Tagline */}
            <div
                style={{
                    opacity: taglineOpacity,
                    transform: `translateY(${taglineY}px)`,
                    marginTop: 50,
                    textAlign: "center",
                }}
            >
                <p
                    style={{
                        fontSize: 32,
                        fontWeight: 300,
                        color: BRAND.white,
                        letterSpacing: "0.25em",
                        textTransform: "uppercase",
                        margin: 0,
                        fontFamily: "'Inter', sans-serif",
                    }}
                >
                    Crafting Women's Essentials
                </p>
            </div>

            {/* Since 2018 */}
            <div
                style={{
                    opacity: sinceOpacity,
                    marginTop: 20,
                }}
            >
                <p
                    style={{
                        fontSize: 24,
                        fontWeight: 400,
                        color: BRAND.gold,
                        letterSpacing: "0.3em",
                        margin: 0,
                        fontFamily: "'Inter', sans-serif",
                    }}
                >
                    SINCE 2018
                </p>
            </div>

            {/* Floating particles */}
            {[...Array(6)].map((_, i) => {
                const delay = i * 20;
                const particleOpacity = interpolate(
                    frame - delay,
                    [0, 30, 200, 280],
                    [0, 0.4, 0.4, 0],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                );
                const y = interpolate(frame - delay, [0, 300], [0, -100], {
                    extrapolateLeft: "clamp",
                });
                const x = Math.sin((frame + i * 50) / 30) * 20;

                return (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            bottom: 300 + i * 80,
                            left: `${30 + i * 10}%`,
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            backgroundColor: BRAND.gold,
                            opacity: particleOpacity,
                            transform: `translate(${x}px, ${y}px)`,
                            boxShadow: `0 0 10px ${BRAND.gold}`,
                        }}
                    />
                );
            })}
        </div>
    );
};
