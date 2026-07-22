import { motion } from "motion/react"

export default function FadeUp({
    children,
    delay = 0
}: {
    children: React.ReactNode;
    delay?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.6,
                delay,
            }}
        >
            {children}
        </motion.div>
    )
}