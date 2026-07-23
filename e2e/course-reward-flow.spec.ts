import { expect, test, type Page } from "@playwright/test";

const courseId = "01COURSEDEMO2026STORY000001";

async function selectProfile(page: Page, role: "Alumno" | "Adulto", name: string) {
  await page.goto("/login");
  await page.getByRole("tab", { name: role, exact: true }).click();
  await page.getByRole("button", { name: new RegExp(`^${name}`) }).click();
}

test("adulto invita, alumna completa una misión y recibe una postal", async ({ page }) => {
  await selectProfile(page, "Adulto", "Lucía");
  await expect(page).toHaveURL(/\/adulto$/u);
  await page.getByRole("link", { name: "Abrir panel", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Exploradores de historias" })).toBeVisible();

  await page.getByRole("button", { name: "Generar invitación", exact: true }).click();
  const inviteUrl = await page.getByLabel("Enlace de invitación").inputValue();
  expect(inviteUrl).toContain("/unirse/");

  await selectProfile(page, "Alumno", "Valentina");
  await page.goto(inviteUrl);
  await page.getByRole("button", { name: "Unirme como Valentina", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Hola, Valentina" })).toBeVisible();

  await page.getByRole("link", { name: "Comenzar misión", exact: true }).click();
  await page.getByRole("link", { name: "Comenzar desafío", exact: true }).click();
  const answerKey = [0, 1, 2, 3, 1];
  const questionHeadings = [
    "¿Qué objeto encontró Luna?",
    "¿Qué podemos deducir de la decisión de Luna?",
    "¿Qué significa “frágil” en el cuento?",
    "¿Qué ocurrió primero?",
    "¿Por qué el problema pudo resolverse?",
  ];
  for (const [index, answer] of answerKey.entries()) {
    await expect(page.getByRole("heading", { name: questionHeadings[index] })).toBeVisible();
    await page.getByRole("radio").nth(answer).click();
    const nextButton = page.getByRole("button", {
      name: index === answerKey.length - 1 ? "Ver resultado" : "Siguiente",
      exact: true,
    });
    await expect(nextButton).toBeEnabled();
    await nextButton.click();
  }
  await expect(page.getByRole("heading", { name: "Increíble trabajo, Valentina" })).toBeVisible();

  await selectProfile(page, "Adulto", "Lucía");
  await page.goto(`/adulto/cursos/${courseId}/alumnos/demo-valentina`);
  await expect(page.getByRole("heading", { name: "Valentina" })).toBeVisible();
  await expect(page.getByText("100%", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Enviar felicitación", exact: true }).click();
  await expect(page.getByText("Postal enviada", { exact: true })).toBeVisible();

  await selectProfile(page, "Alumno", "Valentina");
  await page.goto("/recompensas");
  await expect(page.getByText("10 estrellas", { exact: true })).toBeVisible();
  await expect(page.getByText("“Seguiste cada pista con mucha atención.”", { exact: true })).toBeVisible();
});
