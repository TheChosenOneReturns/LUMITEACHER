import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("Story Teacher app", () => {
  it("renders the Spanish landing call to action", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", {
        name: "¡Cada historia es una nueva aventura!",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /crear mi historia/i }),
    ).toHaveAttribute("href", "/crear");
  });

  it("renders the educational objective in the configurator", () => {
    render(
      <MemoryRouter initialEntries={["/crear"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByText("Objetivo educativo")).toBeInTheDocument();
    expect(
      screen.getByLabelText("¿Qué te gustaría practicar o aprender?"),
    ).toBeInTheDocument();
  });
});

