import React from "react";
import {
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    Sequence,
    Audio,
    staticFile,
} from "remotion";
import { AppleIntro } from "./components/AppleIntro";
import { ProductShowcase } from "./components/ProductShowcase";
import { ValueProps } from "./components/ValueProps";
import { OutroSequence } from "./components/OutroSequence";
import { BRAND } from "./data/products";

/*
 * KEVARA MARKETING AD - 60 SECONDS
 * 
 * Timeline:
 * - Intro: 0-300 frames (0-10s) - Logo + tagline
 * - Products: 300-1350 frames (10-45s) - 6 products showcase
 * - Value Props: 1350-1560 frames (45-52s) - USPs
 * - Outro: 1560-1800 frames (52-60s) - CTA
 * 
 * Audio:
 * - Background music: public/sounds/bg-music.mp3 (add later)
 * - Voiceover: public/sounds/voiceover.mp3 (add via ElevenLabs)
 */

export const MarketingAd: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                backgroundColor: BRAND.black,
                position: "relative",
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            }}
        >
            {/* 
        AUDIO LAYER (uncomment when files are added)
        
        <Audio
          src={staticFile("sounds/bg-music.mp3")}
          volume={0.3}
        />
        
        <Audio
          src={staticFile("sounds/voiceover.mp3")}
          volume={1}
        />
      */}

            {/* ACT 1: Brand Intro (0-10 seconds) */}
            <Sequence from={0} durationInFrames={300} name="Intro">
                <AppleIntro />
            </Sequence>

            {/* ACT 2: Product Showcase (10-45 seconds) */}
            <Sequence from={300} durationInFrames={1050} name="Products">
                <ProductShowcase />
            </Sequence>

            {/* ACT 3: Value Propositions (45-52 seconds) */}
            <Sequence from={1350} durationInFrames={210} name="Value Props">
                <ValueProps />
            </Sequence>

            {/* ACT 4: Call to Action (52-60 seconds) */}
            <Sequence from={1560} durationInFrames={240} name="Outro">
                <OutroSequence />
            </Sequence>
        </div>
    );
};
