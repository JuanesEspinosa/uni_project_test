import { test, expect } from "@playwright/test";
import { captura } from "./helpers/auth.helper";

/**
 * MÓDULO: Registro de Usuario
 * Casos: CP-REG-001 al CP-REG-005
 */
test.describe("MÓDULO: Registro de Usuario", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register.html");
    await page.waitForLoadState("networkidle");
  });

  // ─────────────────────────────────────────────────────────
  // CP-REG-001 | Positivo | Registro exitoso con datos válidos
  // ─────────────────────────────────────────────────────────
  test("CP-REG-001 | Registro exitoso con datos válidos", async ({ page }) => {
    const emailUnico = `test${Date.now()}@correo.com`;

    await page.screenshot({
      path: captura("CP-REG-001", "01-pantalla-registro"),
    });

    await page.fill('input[name="fullName"]', "Usuario Test");
    await page.fill('input[name="email"]', emailUnico);
    await page.fill('input[name="password"]', "Test1234!");
    await page.fill('input[name="confirmPassword"]', "Test1234!");
    await page.screenshot({
      path: captura("CP-REG-001", "02-formulario-completo"),
    });

    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: captura("CP-REG-001", "03-resultado") });

    const alertSuccess = page.locator("#alert-success");
    await expect(alertSuccess).toBeVisible({ timeout: 5000 });
  });

  // ─────────────────────────────────────────────────────────
  // CP-REG-002 | Negativo | Email ya registrado
  // ─────────────────────────────────────────────────────────
  test("CP-REG-002 | Registro con email ya registrado", async ({ page }) => {
    await page.screenshot({
      path: captura("CP-REG-002", "01-pantalla-registro"),
    });

    await page.fill('input[name="fullName"]', "Duplicado Test");
    await page.fill('input[name="email"]', "admin@stockmanager.com"); // ya existe en el seed
    await page.fill('input[name="password"]', "Test1234!");
    await page.fill('input[name="confirmPassword"]', "Test1234!");
    await page.screenshot({
      path: captura("CP-REG-002", "02-email-duplicado"),
    });

    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: captura("CP-REG-002", "03-error-resultado"),
    });

    const alerta = page.locator("#alert");
    await expect(alerta).toBeVisible();
    await expect(page).toHaveURL(/register/);
  });

  // ─────────────────────────────────────────────────────────
  // CP-REG-003 | Negativo | Campos obligatorios vacíos
  // ─────────────────────────────────────────────────────────
  test("CP-REG-003 | Registro con campos vacíos", async ({ page }) => {
    await page.screenshot({
      path: captura("CP-REG-003", "01-formulario-vacio"),
    });

    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: captura("CP-REG-003", "02-validaciones-resultado"),
    });

    const fullNameError = page.locator("#fullName-error");
    await expect(fullNameError).toBeVisible();
    await expect(page).toHaveURL(/register/);
  });

  // ─────────────────────────────────────────────────────────
  // CP-REG-004 | De borde | Contraseña menor a 6 caracteres
  // ─────────────────────────────────────────────────────────
  test("CP-REG-004 | Registro con contraseña muy corta", async ({ page }) => {
    await page.screenshot({
      path: captura("CP-REG-004", "01-pantalla-registro"),
    });

    await page.fill('input[name="fullName"]', "Test Borde");
    await page.fill('input[name="email"]', `borde${Date.now()}@test.com`);
    await page.fill('input[name="password"]', "abc"); // menos de 6 chars
    await page.fill('input[name="confirmPassword"]', "abc");
    await page.screenshot({ path: captura("CP-REG-004", "02-password-corto") });

    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: captura("CP-REG-004", "03-validacion-resultado"),
    });

    const passwordError = page.locator("#password-error");
    await expect(passwordError).toBeVisible();
    await expect(page).toHaveURL(/register/);
  });

  // ─────────────────────────────────────────────────────────
  // CP-REG-005 | De borde | Email con formato inválido
  // ─────────────────────────────────────────────────────────
  test("CP-REG-005 | Registro con email inválido", async ({ page }) => {
    await page.screenshot({
      path: captura("CP-REG-005", "01-pantalla-registro"),
    });

    await page.fill('input[name="fullName"]', "Test Email");
    await page.fill('input[name="email"]', "correosinArroba");
    await page.fill('input[name="password"]', "Test1234!");
    await page.fill('input[name="confirmPassword"]', "Test1234!");
    await page.screenshot({ path: captura("CP-REG-005", "02-email-invalido") });

    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: captura("CP-REG-005", "03-validacion-resultado"),
    });

    // input[type="email"] bloquea el submit con email inválido
    const emailInput = page.locator('input[name="email"]');
    const esInvalido = await emailInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid,
    );
    expect(esInvalido).toBe(true);
    await expect(page).toHaveURL(/register/);
  });
});
