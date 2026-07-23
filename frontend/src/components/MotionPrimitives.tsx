import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ReactNode } from "react";

export const spring = {
  type: "spring",
  stiffness: 260,
  damping: 24,
} as const;

export const gentleSpring = {
  type: "spring",
  stiffness: 150,
  damping: 22,
} as const;

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

export const riseItem: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: gentleSpring },
};

export function PageTransition({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="page-transition"
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 170, damping: 24, mass: 0.82 }}
    >
      {children}
    </motion.div>
  );
}

export function FloatingShape({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.span
      className={`floating-shape ${className}`}
      aria-hidden="true"
      animate={
        reduceMotion
          ? false
          : {
              y: [0, -12, 0],
              rotate: [-4, 5, -4],
              scale: [1, 1.06, 1],
            }
      }
      transition={{
        duration: 4.8,
        delay,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.span>
  );
}
