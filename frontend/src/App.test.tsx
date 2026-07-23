import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { AuthProvider } from "./auth/AuthContext";
import { sessionUserKey } from "./auth/session";
import TransitionProvider from "./components/motion/TransitionProvider";

const profiles = [
  { userId: "demo-sofia", role: "student", displayName: "Sofía", age: 8, avatarId: "explorer", favoriteTheme: "Espacio", selectedAccessoryId: null },
  { userId: "demo-mateo", role: "student", displayName: "Mateo", age: 10, avatarId: "inventor", favoriteTheme: "Inventos", selectedAccessoryId: null },
  { userId: "demo-lucia", role: "adult", displayName: "Lucía", avatarId: "mentor", favoriteTheme: "Fantasía", adultLabel: "Profesor/a", selectedAccessoryId: null },
];
const createdProfile = { userId: "demo-nina-new001", role: "student", displayName: "Nina", age: 9, avatarId: "animal-panda", favoriteTheme: "Selva", selectedAccessoryId: null };

function response(data: unknown, status = 200) {
  return Promise.resolve(new Response(status === 204 ? null : JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } }));
}

function renderApp(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><TransitionProvider><AuthProvider><App /></AuthProvider></TransitionProvider></MemoryRouter>);
}

describe("Story Teacher app", () => {
  beforeEach(() => {
    cleanup(); localStorage.clear();
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/demo/profiles") && init?.method === "POST") return response(createdProfile, 201);
      if (url.endsWith("/demo/profiles")) return response({ items: profiles });
      if (url.endsWith("/me")) {
        const userId = (init?.headers as Record<string, string> | undefined)?.["X-Demo-User-Id"] ?? localStorage.getItem(sessionUserKey);
        return response([...profiles, createdProfile].find((profile) => profile.userId === userId) ?? { error: { message: "Sin sesión" } }, userId ? 200 : 401);
      }
      if (url.endsWith("/courses")) return response({ items: [] });
      return response({ error: { message: `Ruta sin mock: ${url}` } }, 404);
    }));
  });

  afterEach(() => vi.unstubAllGlobals());

  it("muestra la landing en español sin la antigua etiqueta de IA", () => {
    renderApp("/");
    expect(screen.getByRole("heading", { name: /una historia que cobra vida para vos/i })).toBeInTheDocument();
    expect(screen.queryByText(/Lectura \+ imaginación \+ IA/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /crear mi historia/i })).toHaveAttribute("href", "/login?next=%2Fcrear");
  });

  it("ofrece perfiles de estudiante y adulto sin pedir la edad", async () => {
    renderApp("/login");
    expect(await screen.findByRole("button", { name: /sofía/i })).toBeInTheDocument();
    expect(screen.queryByLabelText("Edad")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /adulto/i }));
    expect(screen.getByRole("button", { name: /lucía/i })).toBeInTheDocument();
  });

  it("permite entrar con un perfil demo y conserva sólo su identificador", async () => {
    renderApp("/login");
    fireEvent.click(await screen.findByRole("button", { name: /sofía/i }));
    await waitFor(() => expect(localStorage.getItem(sessionUserKey)).toBe("demo-sofia"));
    expect(localStorage.length).toBe(1);
  });

  it("permite crear un explorador infantil propio y entrar con él", async () => {
    renderApp("/login");
    fireEvent.click(await screen.findByRole("button", { name: /crear mi propio explorador/i }));
    fireEvent.change(screen.getByLabelText(/cómo querés que te llamemos/i), { target: { value: "Nina" } });
    fireEvent.click(screen.getByRole("button", { name: /crear y empezar/i }));
    await waitFor(() => expect(localStorage.getItem(sessionUserKey)).toBe(createdProfile.userId));
  });

  it("protege el configurador y carga una receta completa", async () => {
    localStorage.setItem(sessionUserKey, "demo-sofia");
    renderApp("/crear");
    expect(await screen.findByText("Misión de aprendizaje")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cargar prueba El invento submarino" }));
    expect(screen.getByRole("button", { name: "10 años" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("¿Qué te gustaría practicar o aprender?")).toHaveValue("Analizar causas y consecuencias para encontrar soluciones sustentables");
  });

  it("redirige un adulto fuera de las rutas de estudiante", async () => {
    localStorage.setItem(sessionUserKey, "demo-lucia");
    renderApp("/crear");
    expect(await screen.findByRole("heading", { name: /hola, lucía/i })).toBeInTheDocument();
  });
});
