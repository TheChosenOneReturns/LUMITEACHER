import { motion } from "motion/react"

interface CurtainLogoProps {
    visible: boolean
}

export default function CurtainLogo({ visible }: CurtainLogoProps) {
    return (
        <motion.div
            initial={{
                opacity: 0,
                scale: 0.8,
                y: 20,
                filter: "blur(4px)"
            }}
            animate={{
                opacity: visible ? 1 : 0,
                scale: visible ? 1 : 0.7,
                y: visible ? 0 : 20,
                filter: visible ? "blur(0px)" : "blur(10px)"
            }}
            transition={{
                duration: 0.5
            }}
            className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
        >
            <span className="text-white text-6xl font-bold"> LUMI </span>
        </motion.div>
    )
}