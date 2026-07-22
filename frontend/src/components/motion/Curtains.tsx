
import { motion, Variants } from "motion/react"
import { CurtainState } from "./types"

const variants: Variants = {
    closed: {
        scaleX: 0,
        x: 0
    },
    opening: {
        scaleX: 1,
        x: 0,
        transition: {
            duration: 1,
        }
    },
    covered: {
        scaleX: 1,
        x:0
    },
    exiting: {
        scaleX: 1,
        x: "100%",
        transition: {
            duration: 1,
        }
    },
    hidden: {
        x:"0%",
        scaleX: 0,
        transition: {
            duration: 0
        }
    }
}

interface CurtainsProps {
    state: CurtainState,
    onComplete?: (state: CurtainState) => void;

}

const Curtains = ({ state, onComplete }: CurtainsProps) => {
    return (
        <motion.div
            variants={variants}

            initial={false}

            animate={state}

            onAnimationComplete={(definition) => {
                onComplete?.(definition as CurtainState)
            }}

            className="bg-sky-400 fixed inset-0 origin-left z-[60]">

        </motion.div>
    )
}

export default Curtains