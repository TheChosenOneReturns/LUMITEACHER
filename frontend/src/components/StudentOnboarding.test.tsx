import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StudentOnboarding } from "./StudentOnboarding";

describe("StudentOnboarding", () => {
  afterEach(() => cleanup());

  it("explica el recorrido y permite continuar a la creación", async () => {
    const finish = vi.fn();
    render(
      <StudentOnboarding
        displayName="Sofía"
        onDismiss={vi.fn()}
        onFinish={finish}
      />,
    );

    expect(screen.getByRole("dialog", { name: /hola, sofía/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));
    expect(await screen.findByRole("heading", { name: /leé y tomá decisiones/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));
    fireEvent.click(await screen.findByRole("button", { name: /crear mi primera aventura/i }));
    expect(finish).toHaveBeenCalledOnce();
  });

  it("se puede omitir", () => {
    const dismiss = vi.fn();
    render(
      <StudentOnboarding
        displayName="Mateo"
        onDismiss={dismiss}
        onFinish={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /omitir por ahora/i }));
    expect(dismiss).toHaveBeenCalledOnce();
  });
});
