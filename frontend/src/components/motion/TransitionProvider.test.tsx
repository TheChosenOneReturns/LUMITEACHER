import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import TransitionLink from "./TransitionLink";
import TransitionProvider, { shouldUseCurtainTransition } from "./TransitionProvider";

function First() {
  return <div><h1>Primera</h1><TransitionLink href="/segunda">Continuar</TransitionLink></div>;
}

function Second() {
  const navigate = useNavigate();
  return <div><h1>Segunda</h1><button type="button" onClick={() => navigate(-1)}>Volver</button></div>;
}

function renderFlow() {
  return render(<MemoryRouter initialEntries={["/primera"]}><TransitionProvider><Routes><Route path="/primera" element={<First/>}/><Route path="/segunda" element={<Second/>}/></Routes></TransitionProvider></MemoryRouter>);
}

describe("global transition navigation", () => {
  afterEach(() => cleanup());
  it("navigates inside the SPA and browser history still works", () => {
    renderFlow();
    fireEvent.click(screen.getByRole("link", { name: "Continuar" }));
    expect(screen.getByRole("heading", { name: "Segunda" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Volver" }));
    expect(screen.getByRole("heading", { name: "Primera" })).toBeInTheDocument();
  });

  it("ignores repeated clicks while a navigation is being accepted", () => {
    renderFlow();
    const link = screen.getByRole("link", { name: "Continuar" });
    act(() => {
      fireEvent.click(link);
      fireEvent.click(link);
    });
    expect(screen.getByRole("heading", { name: "Segunda" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Volver" }));
    expect(screen.getByRole("heading", { name: "Primera" })).toBeInTheDocument();
  });

  it("reserves the curtain for login and story creation", () => {
    expect(shouldUseCurtainTransition("/inicio", "/cursos")).toBe(false);
    expect(shouldUseCurtainTransition("/panel", "/perfil")).toBe(false);
    expect(shouldUseCurtainTransition("/inicio", "/login")).toBe(true);
    expect(shouldUseCurtainTransition("/login", "/inicio")).toBe(true);
    expect(shouldUseCurtainTransition("/inicio", "/crear?tema=espacio")).toBe(true);
    expect(shouldUseCurtainTransition("/crear", "/lectura/story-1")).toBe(true);
  });
});
