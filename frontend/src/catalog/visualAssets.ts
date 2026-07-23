import type { CSSProperties } from "react";
import rewardsAtlas from "../assets/generated/story-rewards-atlas.png";

const positions: Record<string, string> = {
  "card-space": "0% 0%",
  "card-fantasy": "50% 0%",
  "card-ocean": "100% 0%",
  "card-jungle": "0% 50%",
  "card-inventions": "50% 50%",
  "card-mystery": "100% 50%",
  "postcard-rocket": "0% 100%",
  "postcard-seed": "50% 100%",
  "postcard-lens": "100% 100%",
};

export function catalogArtStyle(assetId: string): CSSProperties {
  return {
    backgroundImage: `url(${rewardsAtlas})`,
    backgroundPosition: positions[assetId] ?? "50% 50%",
    backgroundSize: "300% 300%",
  };
}
