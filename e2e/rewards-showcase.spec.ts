import { expect, test } from "@playwright/test";

test("Luna puede recorrer todo el atlas, los personajes y las ayudas", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/login");
  await page.getByRole("button", { name: /^Luna/u }).click();
  await expect(page).toHaveURL(/\/inicio$/u);

  await page.goto("/recompensas");
  await expect(page.getByText("999 estrellas", { exact: true })).toBeVisible();
  await expect(page.locator(".world-route")).toHaveCount(6);
  await expect(page.locator(".power-card")).toHaveCount(24);
  await expect(page.locator(".power-card:disabled")).toHaveCount(0);

  for (const game of ["Detectives del cuento", "Conexiones secretas", "El taller de la historia", "Laberinto de decisiones", "Teatro de emociones", "Fábrica de palabras", "Mural de evidencias", "Máquina de causas", "Prisma de perspectivas", "Expedición de pistas"]) {
    const gameCard = page.locator(".arcade-card").filter({ hasText: game });
    await gameCard.getByRole("button", { name: "Jugar ahora" }).click();
    await expect(page.getByRole("dialog", { name: game })).toBeVisible();
    await page.getByRole("button", { name: "Cerrar minijuego" }).click();
  }

  const detectiveCard = page.locator(".arcade-card").filter({ hasText: "Detectives del cuento" });
  const nebulaCard = page.locator(".power-card").filter({ hasText: "Linterna de Nebulosa" });
  const initialCharges = Number((await nebulaCard.locator(".power-card__charges").innerText()).trim());
  await detectiveCard.getByRole("button", { name: "Jugar ahora" }).click();
  await page.getByRole("button", { name: "Usar carta" }).click();
  await page.getByRole("button", { name: /Foco de nebulosa Linterna de Nebulosa/u }).click();
  await expect(page.getByRole("dialog").getByRole("button", { name: "Linterna de Nebulosa", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Cerrar minijuego" }).click();
  await expect(nebulaCard.locator(".power-card__charges")).toContainText(String(initialCharges - 1));

  await page.reload();
  await expect(page.locator(".power-card").filter({ hasText: "Linterna de Nebulosa" }).locator(".power-card__charges")).toContainText(String(initialCharges - 1));

  await page.goto("/perfil");
  await expect(page.getByText("Todo desbloqueado", { exact: true })).toBeVisible();
  await expect(page.locator(".profile-character-picker button")).toHaveCount(24);
  await expect(page.getByRole("button", { name: "Zed, camaleón archivista" })).toHaveAttribute("aria-pressed", "true");
});
