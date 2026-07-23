import { motion } from "motion/react"
import lumiImage from "../../assets/generated/lumi-transition.webp"

interface CurtainLogoProps {
    visible: boolean
}

export default function CurtainLogo({ visible }: CurtainLogoProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: visible ? 1 : 0 }}
            transition={{
                duration: 0.16
            }}
            className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
        >
            <span className="curtain-logo">
                <img src={lumiImage} alt="" />
                <strong>LUMI</strong>
                <small>Preparando la próxima aventura…</small>
            </span>
        </motion.div>
    )
}
