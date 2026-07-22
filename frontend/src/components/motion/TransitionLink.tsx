import { ReactNode } from "react"
import { useLocation } from "react-router-dom"
import { useTransition } from "./TransitionContext"


interface Props {
    href: string
    children: ReactNode
    className?: string
}


export default function TransitionLink({
    href,
    children,
    className
}: Props) {


    const { startTransition } = useTransition()

    const { pathname } = useLocation()


    return (
        <a
            href={href}
            className={className}
            onClick={(e) => {

                e.preventDefault()

                if(href.includes("#")){
                    
                    const [path, hash] = href.split("#")


                    if(path && hash && (pathname === path || (path === "/" && pathname === "/"))){
                        document
                        .getElementById(hash)
                        ?.scrollIntoView({
                            behavior:"smooth"
                        })

                        return
                    }

                }


                if(pathname === href){
                    return
                }


                startTransition(href)

            }}
        >
            {children}
        </a>
    )
}