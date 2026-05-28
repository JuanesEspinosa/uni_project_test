import { test, expect } from "@playwright/test";
import { captura } from "./helpers/auth.helper";
import { TEST_CREDENTIALS } from "./global-setup";

/**
 * MÓDULO: Login
 * Casos: CP-LOGIN-001 al CP-LOGIN-005
 * Prerrequisito: Backend en http://localhost:3000 y frontend en http://localhost:5500
 */
test.describe("MÓDULO: Login", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login.html");
    await page.waitForLoadState("networkidle");
  });

  // ─────────────────────────────────────────────────────────
  // CP-LOGIN-001 | Positivo | Login exitoso con credenciales válidas
  // ─────────────────────────────────────────────────────────
  test("CP-LOGIN-001 | Login exitoso con credenciales válidas", async ({
    page,
  }) => {
    await page.screenshot({
      path: captura("CP-LOGIN-001", "01-pantalla-login"),
    });

    await page.fill('input[name="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[name="password"]', TEST_CREDENTIALS.password);
    await page.screenshot({
      path: captura("CP-LOGIN-001", "02-formulario-lleno"),
    });

    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard.html", { timeout: 10000 });
    await page.screenshot({
      path: captura("CP-LOGIN-001", "03-dashboard-resultado"),
    });

    await expect(page).toHaveURL(/dashboard/);
  });

  // ─────────────────────────────────────────────────────────
  // CP-LOGIN-002 | Negativo | Login con contraseña incorrecta
  // ─────────────────────────────────────────────────────────
  test("CP-LOGIN-002 | Login con contraseña incorrecta", async ({ page }) => {
    await page.screenshot({
      path: captura("CP-LOGIN-002", "01-pantalla-login"),
    });

    await page.fill('input[name="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[name="password"]', "contraseñaIncorrecta999");
    await page.screenshot({
      path: captura("CP-LOGIN-002", "02-password-incorrecto"),
    });

    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: captura("CP-LOGIN-002", "03-error-resultado"),
    });

    const alerta = page.locator("#alert");
    await expect(alerta).toBeVisible();
    await expect(page).toHaveURL(/login/);
  });

  // ─────────────────────────────────────────────────────────
  // CP-LOGIN-003 | Negativo | Login con campos vacíos
  // ─────────────────────────────────────────────────────────
  test("CP-LOGIN-003 | Login con campos vacíos", async ({ page }) => {
    await page.screenshot({
      path: captura("CP-LOGIN-003", "01-formulario-vacio"),
    });

    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: captura("CP-LOGIN-003", "02-validaciones-resultado"),
    });

    const emailError = page.locator("#email-error");
    await expect(emailError).toBeVisible();
    await expect(page).toHaveURL(/login/);
  });

  // ─────────────────────────────────────────────────────────
  // CP-LOGIN-004 | Negativo | Login con usuario no registrado
  // ─────────────────────────────────────────────────────────
  test("CP-LOGIN-004 | Login con usuario no registrado", async ({ page }) => {
    await page.screenshot({
      path: captura("CP-LOGIN-004", "01-pantalla-login"),
    });

    await page.fill('input[name="email"]', "noexiste@test.com");
    await page.fill('input[name="password"]', "CualquierPass123!");
    await page.screenshot({
      path: captura("CP-LOGIN-004", "02-usuario-inexistente"),
    });

    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: captura("CP-LOGIN-004", "03-error-resultado"),
    });

    const alerta = page.locator("#alert");
    await expect(alerta).toBeVisible();
    await expect(page).not.toHaveURL(/dashboard/);
  });

  // ─────────────────────────────────────────────────────────
  // CP-LOGIN-005 | De borde | Login con formato de email inválido
  // ─────────────────────────────────────────────────────────
  test("CP-LOGIN-005 | Login con formato de email inválido", async ({
    page,
  }) => {
    await page.screenshot({
      path: captura("CP-LOGIN-005", "01-pantalla-login"),
    });

    await page.fill('input[name="email"]', "estonoesuncorreo");
    await page.fill('input[name="password"]', "CualquierPass123!");
    await page.screenshot({
      path: captura("CP-LOGIN-005", "02-email-invalido"),
    });

    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: captura("CP-LOGIN-005", "03-validacion-resultado"),
    });

    // input[type="email"] bloquea el submit con email inválido (validación nativa del browser)
    const emailInput = page.locator('input[name="email"]');
    const esInvalido = await emailInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid,
    );
    expect(esInvalido).toBe(true);
    await expect(page).toHaveURL(/login/);
  });
});
