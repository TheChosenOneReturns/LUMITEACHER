import { motion, useReducedMotion } from "motion/react";
import lumiImage from "../assets/generated/lumi-axolotl.png";

interface LumiProps {
  message?: string;
  compact?: boolean;
  mood?: "neutral" | "reading" | "celebrating" | "encouraging";
  accessoryId?: string | null | undefined;
}

export function Lumi({
  message,
  compact = false,
  mood = "neutral",
  accessoryId = null,
}: LumiProps) {
  const reduceMotion = useReducedMotion();

  const moodAnimation = mood === "celebrating"
    ? { y: [0, -10, 0, -5, 0], rotate: [0, -4, 4, -2, 0], scale: [1, 1.04, 1] }
    : mood === "reading"
      ? { y: [0, -4, 0], rotate: [-1.5, 1.5, -1.5] }
      : mood === "encouraging"
        ? { y: [0, -7, 0], rotate: [0, 3, 0] }
        : { y: [0, -5, 0], rotate: [0, 2, 0] };

  return (
    <div className={`lumi ${compact ? "lumi--compact" : ""}`} data-mood={mood}>
      <motion.div
        className="lumi__avatar"
        aria-hidden="true"
        animate={reduceMotion ? false : moodAnimation}
        whileHover={reduceMotion ? {} : { scale: 1.07, rotate: -3 }}
        transition={{ duration: mood === "celebrating" ? 2.6 : 3.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      >
        <img src={lumiImage} alt="" />
        {accessoryId ? <LumiAccessory accessoryId={accessoryId} /> : null}
      </motion.div>
      {message ? (
        <motion.p
          className="lumi__message"
          initial={{ opacity: 0, scale: 0.96, x: -5 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 190, damping: 20 }}
        >
          {message}
        </motion.p>
      ) : null}
    </div>
  );
}

function LumiAccessory({ accessoryId }: { accessoryId: string }) {
  return (
    <svg className={`lumi-accessory lumi-accessory--${accessoryId}`} viewBox="0 0 100 100" aria-hidden="true">
      {accessoryId === "star-crown" ? <path d="M28 31 38 16l12 13 12-13 10 15-5 12H33Z" fill="#fdd73b" stroke="#174b69" strokeWidth="3" /> : null}
      {accessoryId === "adventure-cape" ? <path d="M22 48c-5 18-3 33 10 42l18-17 18 17c13-9 15-24 10-42-8 8-18 11-28 11s-20-3-28-11Z" fill="#ff705d" stroke="#174b69" strokeWidth="3" /> : null}
      {accessoryId === "idea-headphones" ? <path d="M22 51a28 28 0 0 1 56 0M21 49h10v24H21zm48 0h10v24H69z" fill="none" stroke="#6d5dfc" strokeWidth="6" strokeLinecap="round" /> : null}
      {accessoryId === "cosmic-backpack" ? <path d="M69 49c14 1 18 10 14 28H68Z" fill="#6cc8ff" stroke="#174b69" strokeWidth="3" /> : null}
    </svg>
  );
}
