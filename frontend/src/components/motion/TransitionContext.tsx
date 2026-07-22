import {
    createContext,
    useContext
} from "react"


interface TransitionContextProps {

    startTransition: (
        href:string
    )=>void

}


const TransitionContext =
    createContext<TransitionContextProps | null>(null)


export function useTransition(){

    const context =
        useContext(TransitionContext)


    if(!context){
        throw new Error(
            "useTransition debe estar dentro de TransitionProvider"
        )
    }


    return context
}


export default TransitionContext