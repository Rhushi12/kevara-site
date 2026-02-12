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

export const OutroSequence: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Main text entrance
    const textOpacity = interpolate(frame, [0, 30], [0, 1], {
        extrapolateRight: "clamp",
    });

    const textY = interpolate(
        spring({ frame, fps, config: { damping: 12, stiffness: 80 } }),
        [0, 1],
        [60, 0]
    );

    // CTA button animation
    const buttonScale = spring({
        frame: frame - 40,
        fps,
        config: { damping: 10, stiffness: 150, mass: 0.8 },
    });

    // Button glow pulse
    const glowIntensity = interpolate(
        Math.sin((frame - 40) / 10),
        [-1, 1],
        [0.4, 1]
    );

    // Website URL fade in
    const urlOpacity = interpolate(frame, [80, 110], [0, 1], {
        extrapolateRight: "clamp",
    });

    // Logo fade in at end
    const logoOpacity = interpolate(frame, [120, 160], [0, 1], {
        extrapolateRight: "clamp",
    });

    const logoScale = spring({
        frame: frame - 120,
        fps,
        config: { damping: 15, stiffness: 100 },
    });

    // Particle ring animation
    const ringRotation = frame * 0.5;

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
            {/* Animated ring of particles */}
            {[...Array(12)].map((_, i) => {
                const angle = (i / 12) * Math.PI * 2 + (ringRotation * Math.PI) / 180;
                const radius = 400;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius * 0.3; // Ellipse
                const particleOpacity = interpolate(frame, [0, 40], [0, 0.5], {
                    extrapolateRight: "clamp",
                });

                return (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: BRAND.gold,
                            left: `calc(50% + ${x}px)`,
                            top: `calc(50% + ${y}px - 200px)`,
                            opacity: particleOpacity,
                            boxShadow: `0 0 15px ${BRAND.gold}`,
                        }}
                    />
                );
            })}

            {/* Main CTA text */}
            <div
                style={{
                    opacity: textOpacity,
                    transform: `translateY(${textY}px)`,
                    textAlign: "center",
                    marginBottom: 60,
                }}
            >
                <h1
                    style={{
                        fontSize: 80,
                        fontWeight: 700,
                        color: BRAND.white,
                        margin: 0,
                        fontFamily: "'Inter', sans-serif",
                        letterSpacing: "-0.02em",
                        lineHeight: 1.1,
                    }}
                >
                    Discover
                    <br />
                    <span style={{ color: BRAND.gold }}>Your Style</span>
                </h1>
            </div>

            {/* CTA Button */}
            <div
                style={{
                    transform: `scale(${Math.max(0, buttonScale)})`,
                    position: "relative",
                }}
            >
                {/* Glow effect */}
                <div
                    style={{
                        position: "absolute",
                        inset: -30,
                        background: `radial-gradient(ellipse at center, ${BRAND.gold}60, transparent 70%)`,
                        opacity: glowIntensity,
                        filter: "blur(25px)",
                    }}
                />

                {/* Button */}
                <div
                    style={{
                        padding: "35px 100px",
                        background: `linear-gradient(135deg, ${BRAND.gold}, #D4A84B)`,
                        borderRadius: 80,
                        boxShadow: `0 15px 50px ${BRAND.gold}50`,
                        position: "relative",
                    }}
                >
                    <span
                        style={{
                            fontSize: 42,
                            fontWeight: 700,
                            color: BRAND.black,
                            letterSpacing: "0.05em",
                            fontFamily: "'Inter', sans-serif",
                        }}
                    >
                        SHOP NOW
                    </span>
                </div>
            </div>

            {/* Website URL */}
            <div
                style={{
                    marginTop: 80,
                    opacity: urlOpacity,
                    textAlign: "center",
                }}
            >
                <p
                    style={{
                        fontSize: 44,
                        fontWeight: 600,
                        color: BRAND.white,
                        letterSpacing: "0.15em",
                        margin: 0,
                        fontFamily: "'Inter', sans-serif",
                    }}
                >
                    kevara.in
                </p>
            </div>

            {/* Logo at bottom */}
            <div
                style={{
                    position: "absolute",
                    bottom: 100,
                    opacity: logoOpacity,
                    transform: `scale(${Math.max(0, logoScale)})`,
                }}
            >
                <Img
                    src={staticFile("logo.png")}
                    style={{
                        width: 200,
                        height: "auto",
                        filter: `drop-shadow(0 0 20px ${BRAND.gold}40)`,
                    }}
                />
            </div>

            {/* Fade to black at the very end */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: BRAND.black,
                    opacity: interpolate(frame, [220, 240], [0, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                    }),
                }}
            />
        </div>
    );
};
