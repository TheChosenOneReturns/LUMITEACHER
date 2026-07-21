import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Lumi } from "./Lumi";

const navItems = [
  { to: "/inicio", icon: "⌂", label: "Inicio" },
  { to: "/crear", icon: "✦", label: "Crear" },
  { to: "/inicio", icon: "▤", label: "Biblioteca" },
];

export function AppShell() {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink className="brand" to="/" aria-label="Story Teacher, inicio">
          <span className="brand__mark" aria-hidden="true">
            📖
          </span>
          <span>Story Teacher</span>
        </NavLink>

        {!isLanding ? (
          <nav className="desktop-nav" aria-label="Navegación principal">
            <NavLink to="/inicio">Inicio</NavLink>
            <NavLink to="/crear">Crear historia</NavLink>
          </nav>
        ) : null}

        <div className="profile-chip" title="Perfil de demostración">
          <span>Sofía</span>
          <span aria-hidden="true">👧🏽</span>
        </div>
      </header>

      <main id="contenido-principal">
        <Outlet />
      </main>

      {!isLanding ? (
        <nav className="mobile-nav" aria-label="Navegación móvil">
          {navItems.map((item, index) => (
            <NavLink
              key={`${item.label}-${index}`}
              to={item.to}
              className={item.label === "Crear" ? "mobile-nav__create" : ""}
            >
              <span aria-hidden="true">{item.icon}</span>
              <small>{item.label}</small>
            </NavLink>
          ))}
        </nav>
      ) : null}

      <footer className="footer">
        <Lumi compact />
        <p>Historias para imaginar, leer y aprender.</p>
      </footer>
    </div>
  );
}

