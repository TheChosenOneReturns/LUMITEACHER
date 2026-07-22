interface LumiProps {
  message?: string;
  compact?: boolean;
}

export function Lumi({ message, compact = false }: LumiProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={`lumi ${compact ? "lumi--compact" : ""}`}>
      <motion.div
        className="lumi__avatar"
        aria-hidden="true"
        animate={reduceMotion ? false : { y: [0, -5, 0], rotate: [0, 2, 0] }}
        transition={{ duration: 3.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
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
import { motion, useReducedMotion } from "motion/react";
import lumiImage from "../../../stitch_story_teacher_ai_platform/lumi_mascot/screen.png";
