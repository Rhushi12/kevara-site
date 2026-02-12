import React from "react";
import { Composition } from "remotion";
import { MarketingAd } from "./MarketingAd";

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="MarketingAd"
                component={MarketingAd}
                durationInFrames={1800} // 60 seconds at 30fps
                fps={30}
                width={1080}
                height={1920}
            />
        </>
    );
};
