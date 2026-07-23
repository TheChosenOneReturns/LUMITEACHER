import { expect, test } from "@playwright/test";

async function turnToLastPage(page: import("@playwright/test").Page) {
  const nextPage = page.getByRole("button", { name: "Pasar página", exact: true });
  for (let safety = 0; safety < 10 && await nextPage.isEnabled(); safety += 1) {
    await nextPage.click();
    await page.waitForTimeout(280);
  }
}

test("un alumno crea una aventura, elige un final y lleva su recorrido al quiz", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("story-teacher:demo-user-id", "demo-luna"));
  await page.goto("/crear");

  await page.getByRole("button", { name: "Cargar prueba La señal del planeta azul" }).click();
  await page.getByRole("button", { name: /4 Desafío Aventurero/i }).click();
  await page.getByRole("button", { name: "Crear aventura interactiva" }).click();

  await expect(page.getByRole("heading", { name: "Un mensaje entre estrellas" })).toBeVisible();
  await turnToLastPage(page);
  await page.getByRole("button", { name: /D Seguir la canción del satélite o Explorar la cueva luminosa/i }).click();
  await expect(page.getByText("¡Gran lectura! +2 estrellas")).toBeVisible();
  await page.getByRole("button", { name: /^A Seguir la canción del satélite/i }).click();
  await expect(page.getByRole("heading", { name: "La órbita musical" })).toBeVisible();
  await turnToLastPage(page);
  await page.getByRole("button", { name: /C Vas a investigar un patrón de sonidos/i }).click();
  await expect(page.getByText("¡Gran lectura! +2 estrellas")).toBeVisible();
  await page.getByRole("button", { name: /Pedir al equipo que compare señales/i }).click();
  await expect(page.getByRole("heading", { name: "El coro de antenas" })).toBeVisible();
  await turnToLastPage(page);
  await page.getByRole("link", { name: /Desafío de tu aventura/i }).click();

  await expect(page.getByRole("heading", { name: "Las decisiones también dejan pistas" })).toBeVisible();
  await expect(page.getByText("Seguir la canción del satélite", { exact: true })).toBeVisible();
  await expect(page.getByText("Pedir al equipo que compare señales", { exact: true })).toBeVisible();
  await expect(page.getByText("4 estrellas de lectura listas para sumar")).toBeVisible();
  await page.getByRole("button", { name: /Comenzar las cinco preguntas/i }).click();
  await expect(page.getByText("Pregunta 1 de 5")).toBeVisible();
});
