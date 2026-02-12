import React from "react";
import {
    useCurrentFrame,
    useVideoConfig,
    spring,
    interpolate,
    Img,
} from "remotion";
import { PRODUCTS, BRAND } from "../data/products";

export const ProductShowcase: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Each product gets ~175 frames (~5.8 seconds)
    const productDuration = 175;
    const currentProductIndex = Math.min(
        Math.floor(frame / productDuration),
        PRODUCTS.length - 1
    );

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                backgroundColor: BRAND.black,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {PRODUCTS.map((product, index) => {
                const productFrame = frame - index * productDuration;
                const isVisible = productFrame >= -30 && productFrame <= productDuration + 30;

                if (!isVisible) return null;

                // Entry animation
                const entryProgress = spring({
                    frame: productFrame,
                    fps,
                    config: { damping: 18, stiffness: 80, mass: 1 },
                });

                // Exit animation
                const exitOpacity = interpolate(
                    productFrame,
                    [productDuration - 25, productDuration],
                    [1, 0],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                );

                // Ken Burns effect (subtle zoom)
                const imageScale = interpolate(
                    productFrame,
                    [0, productDuration],
                    [1, 1.08],
                    { extrapolateRight: "clamp" }
                );

                // Parallax offset for depth
                const parallaxY = interpolate(
                    productFrame,
                    [0, productDuration],
                    [20, -20],
                    { extrapolateRight: "clamp" }
                );

                const opacity = productFrame < 0 ? 0 : exitOpacity;
                const translateY = interpolate(entryProgress, [0, 1], [80, 0]);

                return (
                    <div
                        key={product.id}
                        style={{
                            position: "absolute",
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            opacity,
                            transform: `translateY(${translateY}px)`,
                        }}
                    >
                        {/* Product Image Container */}
                        <div
                            style={{
                                width: 700,
                                height: 900,
                                borderRadius: 40,
                                overflow: "hidden",
                                boxShadow: `0 40px 80px rgba(0,0,0,0.5), 0 0 100px ${product.color}30`,
                                position: "relative",
                            }}
                        >
                            {/* Gradient overlay */}
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background:
                                        "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.7) 100%)",
                                    zIndex: 2,
                                }}
                            />

                            {/* Product image with Ken Burns */}
                            <Img
                                src={product.image}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    transform: `scale(${imageScale}) translateY(${parallaxY}px)`,
                                }}
                            />

                            {/* Price tag */}
                            <div
                                style={{
                                    position: "absolute",
                                    bottom: 30,
                                    right: 30,
                                    padding: "15px 30px",
                                    background: "rgba(0,0,0,0.6)",
                                    backdropFilter: "blur(10px)",
                                    borderRadius: 30,
                                    zIndex: 3,
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 36,
                                        fontWeight: 600,
                                        color: BRAND.gold,
                                        fontFamily: "'Inter', sans-serif",
                                    }}
                                >
                                    {product.price}
                                </span>
                            </div>
                        </div>

                        {/* Product Info */}
                        <div
                            style={{
                                marginTop: 50,
                                textAlign: "center",
                                opacity: interpolate(productFrame, [20, 50], [0, 1], {
                                    extrapolateRight: "clamp",
                                }),
                            }}
                        >
                            <h2
                                style={{
                                    fontSize: 56,
                                    fontWeight: 600,
                                    color: BRAND.white,
                                    margin: 0,
                                    marginBottom: 15,
                                    fontFamily: "'Inter', sans-serif",
                                    letterSpacing: "-0.02em",
                                }}
                            >
                                {product.shortTitle}
                            </h2>
                            <p
                                style={{
                                    fontSize: 32,
                                    fontWeight: 300,
                                    color: "rgba(255,255,255,0.7)",
                                    margin: 0,
                                    fontFamily: "'Inter', sans-serif",
                                    fontStyle: "italic",
                                }}
                            >
                                {product.tagline}
                            </p>
                        </div>
                    </div>
                );
            })}

            {/* Progress indicator */}
            <div
                style={{
                    position: "absolute",
                    bottom: 80,
                    display: "flex",
                    gap: 12,
                }}
            >
                {PRODUCTS.map((_, i) => {
                    const isActive = i === currentProductIndex;
                    const dotScale = isActive
                        ? spring({
                            frame: frame - i * productDuration,
                            fps,
                            config: { damping: 10, stiffness: 200 },
                        })
                        : 1;

                    return (
                        <div
                            key={i}
                            style={{
                                width: isActive ? 40 : 10,
                                height: 10,
                                borderRadius: 5,
                                backgroundColor: isActive ? BRAND.gold : "rgba(255,255,255,0.3)",
                                transform: `scale(${dotScale})`,
                                transition: "width 0.3s ease",
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
};
