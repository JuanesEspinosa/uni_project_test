import { Page } from "@playwright/test";
import { TEST_CREDENTIALS } from "../global-setup";

/** Genera la ruta de la captura organizada por caso de prueba */
export const captura = (testId: string, paso: string): string =>
  `evidencias/capturas/${testId}-${paso}.png`;

/** Inicia sesión con el usuario de prueba creado por global-setup */
export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto("/login.html");
  await page.waitForLoadState("networkidle");
  await page.fill('input[name="email"]', TEST_CREDENTIALS.email);
  await page.fill('input[name="password"]', TEST_CREDENTIALS.password);
  await page.click('button[type="submit"]');

  try {
    await page.waitForURL("**/dashboard.html", { timeout: 10000 });
  } catch {
    throw new Error(
      `Login falló. URL actual: ${page.url()}\n` +
        `Verifica que el backend esté corriendo en http://localhost:3000`,
    );
  }
}
