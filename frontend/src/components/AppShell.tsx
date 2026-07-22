import {
  BookOpenTextIcon,
  BooksIcon,
  HouseIcon,
  MagicWandIcon,
  SignInIcon,
  UserCircleIcon,
} from "./icons";
import { AnimatePresence, motion } from "motion/react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Lumi } from "./Lumi";
import { PageTransition } from "./MotionPrimitives";
import { ProfileAvatar } from "./VisualIcons";

const navItems = [
  { to: "/inicio", icon: HouseIcon, label: "Inicio" },
  { to: "/crear", icon: MagicWandIcon, label: "Crear" },
  { to: "/perfil", icon: UserCircleIcon, label: "Perfil" },
];

export function AppShell({ protectedOutlet = false }: { protectedOutlet?: boolean }) {
  const location = useLocation();
  const { profile } = useAuth();
  const isPublic = !protectedOutlet;

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink className="brand" to="/" aria-label="Story Teacher, inicio">
          <motion.span
            className="brand__mark"
            aria-hidden="true"
            whileHover={{ rotate: -8, scale: 1.08 }}
          >
            <BookOpenTextIcon size={29} weight="duotone" />
          </motion.span>
          <span>Story <strong>Teacher</strong></span>
        </NavLink>

        {!isPublic ? (
          <nav className="desktop-nav" aria-label="Navegación principal">
            <NavLink to="/inicio"><HouseIcon /> Inicio</NavLink>
            <NavLink to="/crear"><MagicWandIcon /> Crear historia</NavLink>
            <NavLink to="/inicio"><BooksIcon /> Biblioteca</NavLink>
          </nav>
        ) : null}

        {profile ? (
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
            <Link className="profile-chip" to="/perfil" title="Abrir perfil de demostración">
              <span>{profile.name}</span>
              <span className="profile-chip__avatar">
                <ProfileAvatar avatarId={profile.avatarId} />
              </span>
            </Link>
          </motion.div>
        ) : (
          <Link className="header-login" to="/login">
            <SignInIcon size={21} weight="bold" />
            <span>Ingresar</span>
          </Link>
        )}
      </header>

      <main id="contenido-principal">
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>

      {!isPublic ? (
        <nav className="mobile-nav" aria-label="Navegación móvil">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
            <NavLink
              key={item.label}
              to={item.to}
              className={item.label === "Crear" ? "mobile-nav__create" : ""}
            >
              <Icon size={24} weight="duotone" aria-hidden="true" />
              <small>{item.label}</small>
            </NavLink>
            );
          })}
        </nav>
      ) : null}

      {isPublic ? (
        <footer className="footer">
          <Lumi compact />
          <p>Historias para imaginar, leer y aprender.</p>
        </footer>
      ) : null}
    </div>
  );
}
