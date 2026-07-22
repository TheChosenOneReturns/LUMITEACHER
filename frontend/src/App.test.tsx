import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";
import { AuthProvider, demoProfile } from "./auth/AuthContext";

function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("Story Teacher app", () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("muestra una landing en español y lleva al acceso simulado", () => {
    renderApp("/");

    expect(
      screen.getByRole("heading", { name: /una historia que cobra vida para vos/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Lectura + imaginación + IA")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /crear mi historia/i })).toHaveAttribute(
      "href",
      "/login?next=%2Fcrear",
    );
  });

  it("permite entrar con un perfil de demostración", () => {
    renderApp("/login?next=%2F");

    expect(screen.getByText("Acceso de demostración")).toBeInTheDocument();
    expect(screen.queryByLabelText("Edad")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Mundo favorito")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Nombre o apodo"), {
      target: { value: "Valen" },
    });
    fireEvent.click(screen.getByRole("button", { name: /abrir mi mundo/i }));

    expect(screen.getByTitle("Abrir perfil de demostración")).toHaveTextContent("Valen");
  });

  it("protege el configurador y muestra el objetivo educativo al ingresar", () => {
    localStorage.setItem("story-teacher:demo-profile", JSON.stringify(demoProfile));
    renderApp("/crear");

    expect(screen.getByText("Misión de aprendizaje")).toBeInTheDocument();
    expect(
      screen.getByLabelText("¿Qué te gustaría practicar o aprender?"),
    ).toBeInTheDocument();
  });

  it("carga una receta de prueba completa en el configurador", () => {
    localStorage.setItem("story-teacher:demo-profile", JSON.stringify(demoProfile));
    renderApp("/crear");

    fireEvent.click(
      screen.getByRole("button", { name: "Cargar prueba El invento submarino" }),
    );

    expect(screen.getByRole("button", { name: "10 años" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByLabelText("¿Qué te gustaría practicar o aprender?"),
    ).toHaveValue(
      "Analizar causas y consecuencias para encontrar soluciones sustentables",
    );
    expect(
      screen.getByLabelText("¿Quién será el héroe de la aventura?"),
    ).toHaveValue("Nico, un inventor que conversa con las ballenas");
  });
});
