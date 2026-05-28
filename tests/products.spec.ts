import { test, expect } from "@playwright/test";
import { captura, loginAsAdmin } from "./helpers/auth.helper";

/**
 * MÓDULO: Productos
 * Casos: CP-PROD-001 al CP-PROD-005
 */
test.describe("MÓDULO: Productos", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/products-form.html");
    await page.waitForLoadState("networkidle");
  });

  // ─────────────────────────────────────────────────────────
  // CP-PROD-001 | Positivo | Crear producto con datos válidos
  // ─────────────────────────────────────────────────────────
  test("CP-PROD-001 | Crear producto con datos válidos", async ({ page }) => {
    await page.screenshot({
      path: captura("CP-PROD-001", "01-formulario-producto"),
    });

    await page.fill('input[name="name"]', `Perfume Test ${Date.now()}`);
    await page.fill('input[name="price"]', "85000");
    await page.fill('input[name="stock"]', "50");
    await page.fill('input[name="category"]', "Perfumes");
    await page.fill('textarea[name="description"]', "Fragancia floral 50ml");
    await page.screenshot({
      path: captura("CP-PROD-001", "02-formulario-completo"),
    });

    await page.click('button[type="submit"]');
    await page.waitForURL("**/products.html", { timeout: 8000 });
    await page.screenshot({
      path: captura("CP-PROD-001", "03-lista-con-producto"),
    });

    await expect(page).toHaveURL(/products\.html/);
  });

  // ─────────────────────────────────────────────────────────
  // CP-PROD-002 | De borde | Precio negativo
  // ─────────────────────────────────────────────────────────
  test("CP-PROD-002 | Crear producto con precio negativo", async ({ page }) => {
    await page.screenshot({
      path: captura("CP-PROD-002", "01-formulario-producto"),
    });

    await page.fill('input[name="name"]', "Producto Precio Negativo");
    await page.fill('input[name="price"]', "-5000");
    await page.fill('input[name="stock"]', "10");
    await page.screenshot({
      path: captura("CP-PROD-002", "02-precio-negativo"),
    });

    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: captura("CP-PROD-002", "03-validacion-resultado"),
    });

    const priceError = page.locator("#price-error");
    await expect(priceError).toBeVisible();
    await expect(page).toHaveURL(/products-form/);
  });

  // ─────────────────────────────────────────────────────────
  // CP-PROD-003 | Negativo | Nombre vacío
  // ─────────────────────────────────────────────────────────
  test("CP-PROD-003 | Crear producto sin nombre", async ({ page }) => {
    await page.screenshot({
      path: captura("CP-PROD-003", "01-formulario-producto"),
    });

    // Dejar nombre vacío, llenar los demás campos
    await page.fill('input[name="price"]', "10000");
    await page.fill('input[name="stock"]', "5");
    await page.screenshot({ path: captura("CP-PROD-003", "02-nombre-vacio") });

    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: captura("CP-PROD-003", "03-validacion-resultado"),
    });

    const nameError = page.locator("#name-error");
    await expect(nameError).toBeVisible();
    await expect(page).toHaveURL(/products-form/);
  });

  // ─────────────────────────────────────────────────────────
  // CP-PROD-004 | De borde | Stock en cero (debe aceptarse)
  // ─────────────────────────────────────────────────────────
  test("CP-PROD-004 | Crear producto con stock 0", async ({ page }) => {
    await page.screenshot({
      path: captura("CP-PROD-004", "01-formulario-producto"),
    });

    await page.fill('input[name="name"]', `Producto Stock Cero ${Date.now()}`);
    await page.fill('input[name="price"]', "10000");
    await page.fill('input[name="stock"]', "0");
    await page.screenshot({ path: captura("CP-PROD-004", "02-stock-cero") });

    await page.click('button[type="submit"]');
    await page.waitForURL("**/products.html", { timeout: 8000 });
    await page.screenshot({ path: captura("CP-PROD-004", "03-resultado") });

    // Stock 0 es válido — debe redirigir a la lista sin error
    await expect(page).toHaveURL(/products\.html/);
  });

  // ─────────────────────────────────────────────────────────
  // CP-PROD-005 | De borde | Nombre con más de 100 caracteres
  // ─────────────────────────────────────────────────────────
  test("CP-PROD-005 | Crear producto con nombre mayor a 100 caracteres", async ({
    page,
  }) => {
    await page.screenshot({
      path: captura("CP-PROD-005", "01-formulario-producto"),
    });

    const nombreLargo = "A".repeat(150); // 150 chars, supera el límite de 100
    await page.fill('input[name="name"]', nombreLargo);
    await page.fill('input[name="price"]', "10000");
    await page.fill('input[name="stock"]', "1");
    await page.screenshot({ path: captura("CP-PROD-005", "02-nombre-largo") });

    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: captura("CP-PROD-005", "03-validacion-resultado"),
    });

    // El frontend o el backend rechazan nombres > 100 chars
    const nameError = page.locator("#name-error");
    await expect(nameError).toBeVisible();
    await expect(page).toHaveURL(/products-form/);
  });
});
