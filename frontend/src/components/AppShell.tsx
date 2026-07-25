import {
  ArrowLeftIcon,
  BookOpenTextIcon,
  ChartLineUpIcon,
  GiftIcon,
  GraduationCapIcon,
  HouseIcon,
  MagicWandIcon,
  SignInIcon,
  UserCircleIcon,
  UsersThreeIcon,
} from "./icons";
import { motion } from "motion/react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import type { MouseEvent } from "react";
import { useAuth, type AvatarId } from "../auth/AuthContext";
import { Lumi } from "./Lumi";
import { PageTransition } from "./MotionPrimitives";
import { ProfileAvatar } from "./VisualIcons";
import { useTransition } from "./motion/TransitionContext";

const studentNav = [
  { to: "/inicio", icon: HouseIcon, label: "Inicio", end: false },
  { to: "/crear", icon: MagicWandIcon, label: "Crear", end: false },
  { to: "/recompensas", icon: GiftIcon, label: "Juegos", end: false },
  { to: "/perfil", icon: UserCircleIcon, label: "Perfil", end: false },
];

const adultNav = [
  { to: "/adulto", icon: ChartLineUpIcon, label: "Panel", end: true },
  { to: "/adulto/cursos", icon: UsersThreeIcon, label: "Cursos", end: false },
  { to: "/perfil", icon: UserCircleIcon, label: "Perfil", end: false },
];

export function AppShell({ protectedOutlet = false }: { protectedOutlet?: boolean }) {
  const location = useLocation();
  const { startTransition } = useTransition();
  const { profile } = useAuth();
  const isPublic = !protectedOutlet;
  const navItems = profile?.role === "adult" ? adultNav : studentNav;
  const homePath = profile?.role === "adult" ? "/adulto" : "/inicio";

  function animateInternalNavigation(event: MouseEvent<HTMLDivElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = event.target as Element;
    const anchor = target.closest("a[href]");
    if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin || /^(?:mailto:|tel:)/u.test(anchor.getAttribute("href") ?? "")) return;
    const current = `${location.pathname}${location.search}${location.hash}`;
    const destination = `${url.pathname}${url.search}${url.hash}`;
    if (destination === current || (url.hash && url.pathname === location.pathname)) return;
    event.preventDefault();
    startTransition(destination);
  }

  return (
    <div className={`app-shell ${profile?.role === "adult" ? "app-shell--adult" : ""}`} onClickCapture={animateInternalNavigation}>
      <header className="topbar">
        <NavLink className="brand" to={profile ? homePath : "/"} aria-label="Story Teacher, inicio">
          <motion.span className="brand__mark" aria-hidden="true" whileHover={{ rotate: -8, scale: 1.08 }}>
            <BookOpenTextIcon size={29} weight="duotone" />
          </motion.span>
          <span>Story <strong>Teacher</strong></span>
        </NavLink>

        {!isPublic && profile ? (
          <nav className="desktop-nav" aria-label="Navegación principal">
            {navItems.slice(0, profile.role === "adult" ? 2 : 3).map((item) => {
              const Icon = item.icon;
              return <NavLink key={`${item.to}-${item.label}`} to={item.to} end={item.end}><Icon /> {item.label}</NavLink>;
            })}
          </nav>
        ) : null}

        {profile ? (
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
            <Link className="profile-chip" to="/perfil" title="Abrir perfil de demostración">
              {profile.role === "adult" ? <GraduationCapIcon size={18} weight="duotone" /> : null}
              <span>{profile.displayName}</span>
              <span className="profile-chip__avatar">
                <ProfileAvatar avatarId={profile.avatarId as AvatarId} />
              </span>
            </Link>
          </motion.div>
        ) : location.pathname === "/login" ? (
          <Link className="header-login" to="/"><ArrowLeftIcon size={21} weight="bold" /><span>Volver al inicio</span></Link>
        ) : (
          <Link className="header-login" to="/login"><SignInIcon size={21} weight="bold" /><span>Ingresar</span></Link>
        )}
      </header>

      <main id="contenido-principal">
        <PageTransition key={location.pathname}><Outlet /></PageTransition>
      </main>

      {!isPublic && profile ? (
        <nav className={`mobile-nav ${profile.role === "adult" ? "mobile-nav--adult" : ""}`} aria-label="Navegación móvil">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={`${item.to}-${item.label}`} to={item.to} end={item.end} className={item.label === "Crear" ? "mobile-nav__create" : ""}>
                <Icon size={24} weight="duotone" aria-hidden="true" /><small>{item.label}</small>
              </NavLink>
            );
          })}
        </nav>
      ) : null}

      {isPublic ? <footer className="footer"><Lumi compact /><p>Historias para imaginar, leer y aprender.</p></footer> : null}
    </div>
  );
}
