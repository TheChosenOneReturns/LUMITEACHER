import { motion, useReducedMotion } from "motion/react";
import lumiImage from "../assets/generated/lumi-axolotl.png";

interface LumiProps {
  message?: string;
  compact?: boolean;
  mood?: "neutral" | "reading" | "celebrating" | "encouraging";
}

export function Lumi({
  message,
  compact = false,
  mood = "neutral",
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
