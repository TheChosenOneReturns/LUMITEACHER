import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

export function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const reduceMotion = useReducedMotion();
  const motionValue = useMotionValue(reduceMotion ? value : 0);
  const [display, setDisplay] = useState(reduceMotion ? value : 0);
  useMotionValueEvent(motionValue, "change", (latest) => setDisplay(Math.round(latest)));
  useEffect(() => {
    if (reduceMotion) { motionValue.set(value); return; }
    const controls = animate(motionValue, value, { duration: .75, ease: "easeOut" });
    return () => controls.stop();
  }, [motionValue, reduceMotion, value]);
  return <motion.strong initial={reduceMotion ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>{display}{suffix}</motion.strong>;
}
