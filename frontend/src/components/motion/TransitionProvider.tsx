import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useReducedMotion } from "motion/react";
import Curtains from "./Curtains";
import CurtainLogo from "./CurtainLogo";
import TransitionContext from "./TransitionContext";
import type { CurtainState } from "./types";

const curtainRoutes = ["/login", "/crear"] as const;

function pathnameFromHref(href: string) {
  return href.split(/[?#]/u, 1)[0] || "/";
}

export function shouldUseCurtainTransition(currentPathname: string, href: string) {
  const destinationPathname = pathnameFromHref(href);
  return curtainRoutes.some((route) => currentPathname === route || destinationPathname === route);
}

export default function TransitionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const [nextRoute, setNextRoute] = useState<string | null>(null);
  const [curtainState, setCurtainState] = useState<CurtainState>("hidden");
  const timer = useRef<number | null>(null);
  const routeRef = useRef<string | null>(null);
  const lockedRef = useRef(false);
  const immersiveRoute = location.pathname === "/login"
    || location.pathname === "/crear"
    || nextRoute?.startsWith("/login")
    || nextRoute?.startsWith("/crear");

  const clearTimer = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const startTransition = useCallback(
    (href: string) => {
      const current = `${location.pathname}${location.search}${location.hash}`;
      if (href === current || lockedRef.current || nextRoute) return;
      const useCurtain = shouldUseCurtainTransition(location.pathname, href);
      if (!useCurtain || reduceMotion || import.meta.env.MODE === "test") {
        lockedRef.current = true;
        navigate(href);
        queueMicrotask(() => { lockedRef.current = false; });
        return;
      }
      lockedRef.current = true;
      routeRef.current = href;
      setNextRoute(href);
      setCurtainState("opening");
    },
    [location, navigate, nextRoute, reduceMotion],
  );

  function complete(state: CurtainState) {
    if (state === "opening") {
      setCurtainState("covered");
      clearTimer();
      timer.current = window.setTimeout(() => {
        const destination = routeRef.current;
        routeRef.current = null;
        lockedRef.current = false;
        setNextRoute(null);
        if (destination) navigate(destination);
        setCurtainState("exiting");
      }, 320);
    }
    if (state === "exiting") {
      lockedRef.current = false;
      setCurtainState("hidden");
    }
  }

  return (
    <TransitionContext.Provider value={{ startTransition }}>
      <Curtains state={curtainState} onComplete={complete} />
      <CurtainLogo visible={curtainState === "covered" && Boolean(immersiveRoute)} />
      {children}
    </TransitionContext.Provider>
  );
}
