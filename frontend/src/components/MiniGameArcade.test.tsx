import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MiniGameArcade } from "./MiniGameArcade";
import { platformCatalog, type RewardState } from "@story-teacher/shared";
import { api } from "../api/client";

const rewards: RewardState = {
  totalStars: 0, mapStep: 0, completedStoryIds: [], unlockedBadgeIds: [], unlockedCardIds: [], cardInventory: {},
  worldMasteryCounts: { space: 0, fantasy: 0, ocean: 0, jungle: 0, inventions: 0, mystery: 0 },
  unlockedAvatarIds: platformCatalog.avatars.filter((avatar) => avatar.base).map((avatar) => avatar.id),
  unlockedAccessoryIds: [], selectedAccessoryId: null,
  skillCorrect: { literal: 0, inference: 0, vocabulary: 0, sequence: 0, cause_effect: 0 }, activeDayKeys: [],
};

const unlockedRewards: RewardState = {
  ...rewards,
  totalStars: 999,
  unlockedCardIds: platformCatalog.cards.map((card) => card.id),
  cardInventory: Object.fromEntries(platformCatalog.cards.map((card) => [card.id, 9])),
};

async function openGame(name: string) {
  const heading = screen.getByRole("heading", { name });
  fireEvent.click(within(heading.closest("article")!).getByRole("button", { name: "Jugar ahora" }));
  fireEvent.click(screen.getByRole("button", { name: "Usar carta" }));
}

function launchGame(name: string) {
  const heading = screen.getByRole("heading", { name });
  fireEvent.click(within(heading.closest("article")!).getByRole("button", { name: "Jugar ahora" }));
}

describe("cognitive mini games", () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it("replaces the reflex-only game with a reading comprehension challenge", () => {
    render(<MiniGameArcade catalog={platformCatalog} rewards={rewards} onRewardsChange={() => undefined} />);
    expect(screen.queryByText(/Cazaestrellas/i)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Detectives del cuento" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Jugar ahora" }));
    expect(screen.getByText(/caso 1 de 3/i)).toBeInTheDocument();
    const options = document.querySelectorAll(".detective-options button");
    expect(options).toHaveLength(4);
    fireEvent.click(options[0]!);
    expect(screen.getByText(/La evidencia encaja|Probemos otra estrategia/i)).toBeInTheDocument();
  });

  it("keeps semantic and causal games behind progressive unlocks", () => {
    render(<MiniGameArcade catalog={platformCatalog} rewards={rewards} onRewardsChange={() => undefined} />);
    expect(screen.getByText("10 estrellas")).toBeInTheDocument();
    expect(screen.getByText("25 estrellas")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Conexiones secretas" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "El taller de la historia" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Máquina de causas" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Expedición de pistas" })).toBeInTheDocument();
    expect(screen.getAllByRole("article").filter((article) => article.classList.contains("arcade-card"))).toHaveLength(10);
  });

  it("aplica una pista visual consumida en Detective", async () => {
    vi.spyOn(api, "consumeCard").mockResolvedValue(unlockedRewards);
    render(<MiniGameArcade catalog={platformCatalog} rewards={unlockedRewards} onRewardsChange={() => undefined} />);
    await openGame("Detectives del cuento");
    fireEvent.click(screen.getByRole("button", { name: /Linterna de Nebulosa/ }));
    expect(await screen.findByText(/Evidencia iluminada:/)).toBeInTheDocument();
  });

  it("revela una pareja en Conexiones", async () => {
    vi.spyOn(api, "consumeCard").mockResolvedValue(unlockedRewards);
    render(<MiniGameArcade catalog={platformCatalog} rewards={unlockedRewards} onRewardsChange={() => undefined} />);
    await openGame("Conexiones secretas");
    fireEvent.click(screen.getByRole("button", { name: /Radar de Órbita/ }));
    await waitFor(() => expect(document.querySelectorAll(".memory-grid button.is-scanned")).toHaveLength(1));
  });

  it("coloca el primer acontecimiento en Secuencia", async () => {
    vi.spyOn(api, "consumeCard").mockResolvedValue(unlockedRewards);
    render(<MiniGameArcade catalog={platformCatalog} rewards={unlockedRewards} onRewardsChange={() => undefined} />);
    await openGame("El taller de la historia");
    fireEvent.click(screen.getByRole("button", { name: /Reloj de Gravedad/ }));
    expect(await screen.findByText("Escena 1 ubicada")).toBeInTheDocument();
  });

  it("ofrece diez experiencias visuales con mecánicas cognitivas diferentes", () => {
    render(<MiniGameArcade catalog={platformCatalog} rewards={unlockedRewards} onRewardsChange={() => undefined} />);
    const games = [
      ["Detectives del cuento", /caso 1 de 3/i],
      ["Conexiones secretas", /Relacioná objetos/i],
      ["El taller de la historia", /Elegí qué hecho/i],
      ["Laberinto de decisiones", /cruce 1 de 3/i],
      ["Teatro de emociones", /escena 1 de 3/i],
      ["Fábrica de palabras", /Contexto variable/i],
      ["Mural de evidencias", /Pruebas encontradas/i],
      ["Máquina de causas", /Encendé los engranajes/i],
      ["Prisma de perspectivas", /mirada 1 de 2/i],
      ["Expedición de pistas", /Mapa variable/i],
    ] as const;
    for (const [name, visibleText] of games) {
      launchGame(name);
      expect(screen.getAllByText(visibleText).length).toBeGreaterThan(0);
      fireEvent.click(screen.getByRole("button", { name: "Cerrar minijuego" }));
    }
  });

  it("cambia cantidad de desafíos según el nivel elegido", () => {
    render(<MiniGameArcade catalog={platformCatalog} rewards={unlockedRewards} onRewardsChange={() => undefined} />);
    launchGame("Detectives del cuento");
    fireEvent.click(screen.getByRole("button", { name: /Explorador/i }));
    expect(screen.getByText(/caso 1 de 2/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Maestro/i }));
    expect(screen.getByText(/caso 1 de 4/i)).toBeInTheDocument();
    expect(document.querySelector(".cognitive-game-frame.difficulty-master")).toBeInTheDocument();
  });
});
