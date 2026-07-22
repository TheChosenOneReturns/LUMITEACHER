import { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"

import Curtains from "./Curtains"
import CurtainLogo from "./CurtainLogo"
import TransitionContext from "./TransitionContext"

import { CurtainState } from "./types"

interface Props {
    children: React.ReactNode
}

export default function TransitionProvider({
    children
}: Props) {

    const navigate = useNavigate();
    const { pathname } = useLocation();

    const [isReadyToNavigate, setIsReadyToNavigate] = useState(false)

    const [nextRoute, setNextRoute] =
        useState<string | null>(null)

    const [curtainState, setCurtainState] =
        useState<CurtainState>("closed")

    const showLogo =
        curtainState === "covered"

    const startTransition = (href: string) => {
        setNextRoute(href)
        setCurtainState("opening")
    }

    useEffect(() => {
        if (curtainState === "covered" && nextRoute) {
            setCurtainState("exiting")

            setNextRoute(null)

        }
    }, [pathname])

    useEffect(() => {

    if(isReadyToNavigate && nextRoute){

        navigate(nextRoute)

        setIsReadyToNavigate(false)

    }

}, [isReadyToNavigate])

    return (
        <TransitionContext.Provider
            value={{
                startTransition
            }}

        >
            <Curtains
                state={curtainState}
                onComplete={(state) => {
                    if (state === "opening") {

                        setCurtainState("covered")

                        setTimeout(() => {
                            setIsReadyToNavigate(true)
                        }, 800)

                    }

                    if (state === "exiting") {
                        setCurtainState("hidden")
                    }

                }}
            />
            <CurtainLogo visible={showLogo} />
            {children}
        </TransitionContext.Provider>
    )
}