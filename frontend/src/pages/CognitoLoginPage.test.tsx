import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "../api/client";
import { CognitoLoginPage } from "./CognitoLoginPage";

const mocks = vi.hoisted(() => ({
  bootstrapProfile: vi.fn(),
  confirmSignUp: vi.fn(),
  getCurrentUser: vi.fn(),
  getMe: vi.fn(),
  refreshProfile: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
  startTransition: vi.fn(),
}));

vi.mock("aws-amplify/auth", () => ({
  confirmSignUp: mocks.confirmSignUp,
  getCurrentUser: mocks.getCurrentUser,
  signIn: mocks.signIn,
  signOut: mocks.signOut,
  signUp: mocks.signUp,
}));

vi.mock("../api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/client")>();
  return {
    ...actual,
    api: {
      ...actual.api,
      bootstrapProfile: mocks.bootstrapProfile,
      getMe: mocks.getMe,
    },
  };
});

vi.mock("../auth/AuthContext", () => ({
  useAuth: () => ({ refreshProfile: mocks.refreshProfile }),
}));

vi.mock("../components/motion/TransitionContext", () => ({
  useTransition: () => ({ startTransition: mocks.startTransition }),
}));

const profile = {
  userId: "cognito-user",
  role: "student",
  displayName: "Lector",
  age: 9,
  avatarId: "animal-fox",
  favoriteTheme: "Espacio",
  selectedAccessoryId: null,
} as const;

function renderPage(initialEntry = "/login?next=%2Finicio") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <CognitoLoginPage />
    </MemoryRouter>,
  );
}

describe("CognitoLoginPage", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mocks.signOut.mockResolvedValue(undefined);
    mocks.refreshProfile.mockResolvedValue(undefined);
  });

  afterEach(() => cleanup());

  it("limpia una sesión rechazada por el API y permite volver a ingresar", async () => {
    mocks.getCurrentUser
      .mockResolvedValueOnce({ username: "stale-user" })
      .mockRejectedValue(new Error("No hay sesión"));
    mocks.getMe
      .mockRejectedValueOnce(
        new ApiClientError("Unauthorized", "NO_SESSION", 401),
      )
      .mockResolvedValue(profile);
    mocks.signIn.mockResolvedValue({ isSignedIn: true, nextStep: {} });

    renderPage();

    expect(
      await screen.findByText(/tu sesión anterior venció o quedó incompleta/i),
    ).toBeInTheDocument();
    expect(mocks.signOut).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: "lector@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: "Password!123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^ingresar/i }));

    await waitFor(() => {
      expect(mocks.startTransition).toHaveBeenCalledWith("/inicio");
    });
    expect(mocks.signIn).toHaveBeenCalledTimes(1);
  });

  it("reanuda una sesión válida sin ejecutar otro signIn", async () => {
    mocks.getCurrentUser.mockResolvedValue({ username: "active-user" });
    mocks.getMe.mockResolvedValue(profile);

    renderPage();

    await waitFor(() => {
      expect(mocks.startTransition).toHaveBeenCalledWith("/inicio");
    });
    expect(mocks.refreshProfile).toHaveBeenCalled();
    expect(mocks.signIn).not.toHaveBeenCalled();
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it("diferencia el acceso adulto cuando llega desde la landing", async () => {
    mocks.getCurrentUser.mockRejectedValue(new Error("No hay sesión"));

    renderPage("/login?role=adult&next=%2Fadulto");

    expect(
      await screen.findByRole("heading", { name: /entrá al espacio adulto/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /adulto\/a/i })).toBeChecked();
    expect(screen.getByRole("radio", { name: /niño\/a/i })).not.toBeChecked();
  });
});
