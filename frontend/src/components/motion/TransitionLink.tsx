import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useTransition } from "./TransitionContext";

interface Props extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  children: ReactNode;
}

export default function TransitionLink({ href, children, onClick, ...props }: Props) {
  const { startTransition } = useTransition();
  const { pathname } = useLocation();

  function navigate(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      props.target === "_blank" ||
      /^(?:https?:|mailto:|tel:)/u.test(href)
    ) return;

    event.preventDefault();
    if (href.includes("#")) {
      const [path, hash] = href.split("#");
      if (hash && (!path || path === pathname || (path === "/" && pathname === "/"))) {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    startTransition(href);
  }

  return <a href={href} {...props} onClick={navigate}>{children}</a>;
}
