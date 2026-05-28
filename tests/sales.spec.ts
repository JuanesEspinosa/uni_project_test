import { test, expect } from "@playwright/test";
import { captura, loginAsAdmin } from "./helpers/auth.helper";

/**
 * MÓDULO: Ventas (equivalente al Carrito)
 * Casos: CP-VENTA-001 al CP-VENTA-005
 */
test.describe("MÓDULO: Ventas (Carrito)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/sales-form.html");
    await page.waitForLoadState("networkidle");
    // Esperar a que carguen clientes y productos del backend
    await page.waitForTimeout(1200);
  });

  // ─────────────────────────────────────────────────────────
  // CP-VENTA-001 | Positivo | Crear venta válida con producto en stock
  // ─────────────────────────────────────────────────────────
  test("CP-VENTA-001 | Crear venta con productos en stock", async ({
    page,
  }) => {
    await page.screenshot({
      path: captura("CP-VENTA-001", "01-formulario-venta"),
    });

    // Seleccionar el primer cliente disponible
    await page.selectOption("#client-id", { index: 1 });

    // Seleccionar el primer producto en la fila automática
    await page.locator(".item-product").first().selectOption({ index: 1 });
    await page.waitForTimeout(300);
    await page.locator(".item-qty").first().fill("2");
    await page.screenshot({
      path: captura("CP-VENTA-001", "02-venta-configurada"),
    });

    await page.click('button[type="submit"]');
    await page.waitForURL("**/sales.html", { timeout: 10000 });
    await page.screenshot({
      path: captura("CP-VENTA-001", "03-venta-registrada"),
    });

    await expect(page).toHaveURL(/sales\.html/);
  });

  // ─────────────────────────────────────────────────────────
  // CP-VENTA-002 | Negativo | Cantidad mayor al stock disponible
  // ─────────────────────────────────────────────────────────
  test("CP-VENTA-002 | Venta con cantidad mayor al stock disponible", async ({
    page,
  }) => {
    await page.screenshot({
      path: captura("CP-VENTA-002", "01-formulario-venta"),
    });

    await page.selectOption("#client-id", { index: 1 });
    await page.locator(".item-product").first().selectOption({ index: 1 });
    await page.waitForTimeout(300);
    await page.locator(".item-qty").first().fill("99999"); // supera cualquier stock
    await page.screenshot({
      path: captura("CP-VENTA-002", "02-cantidad-excesiva"),
    });

    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: captura("CP-VENTA-002", "03-error-stock") });

    // El backend rechaza y muestra el mensaje de error
    const alerta = page.locator("#alert");
    await expect(alerta).toBeVisible();
    await expect(page).toHaveURL(/sales-form/);
  });

  // ─────────────────────────────────────────────────────────
  // CP-VENTA-003 | Positivo | El total se calcula correctamente en tiempo real
  // ─────────────────────────────────────────────────────────
  test("CP-VENTA-003 | El total se calcula correctamente", async ({ page }) => {
    await page.screenshot({
      path: captura("CP-VENTA-003", "01-formulario-venta"),
    });

    // Seleccionar producto
    await page.locator(".item-product").first().selectOption({ index: 1 });
    await page.waitForTimeout(400);

    // Poner cantidad 3
    await page.locator(".item-qty").first().fill("3");
    await page.waitForTimeout(300);
    await page.screenshot({
      path: captura("CP-VENTA-003", "02-total-calculado"),
    });

    // El total debe ser mayor a $0 y estar visible
    const totalTexto = await page.locator("#sale-total").textContent();
    expect(totalTexto).not.toBe("$0");
    expect(totalTexto?.trim()).not.toBe("");

    // El contador de productos debe ser 1
    const itemCount = await page.locator("#item-count").textContent();
    expect(Number(itemCount)).toBeGreaterThan(0);
  });

  // ─────────────────────────────────────────────────────────
  // CP-VENTA-004 | Negativo | Venta sin seleccionar cliente
  // ─────────────────────────────────────────────────────────
  test("CP-VENTA-004 | Crear venta sin seleccionar cliente", async ({
    page,
  }) => {
    await page.screenshot({
      path: captura("CP-VENTA-004", "01-formulario-venta"),
    });

    // Agregar producto pero NO seleccionar cliente
    await page.locator(".item-product").first().selectOption({ index: 1 });
    await page.waitForTimeout(300);
    await page.locator(".item-qty").first().fill("1");
    await page.screenshot({ path: captura("CP-VENTA-004", "02-sin-cliente") });

    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: captura("CP-VENTA-004", "03-validacion-resultado"),
    });

    const clienteError = page.locator("#client-error");
    await expect(clienteError).toBeVisible();
    await expect(page).toHaveURL(/sales-form/);
  });

  // ─────────────────────────────────────────────────────────
  // CP-VENTA-005 | Negativo | Venta sin agregar productos
  // ─────────────────────────────────────────────────────────
  test("CP-VENTA-005 | Crear venta sin agregar productos", async ({ page }) => {
    await page.screenshot({
      path: captura("CP-VENTA-005", "01-formulario-venta"),
    });

    // Seleccionar cliente
    await page.selectOption("#client-id", { index: 1 });

    // Eliminar la fila de producto que se agrega automáticamente
    const removeBtn = page.locator(".btn-remove-item").first();
    if (await removeBtn.isVisible()) {
      await removeBtn.click();
    }

    await page.screenshot({
      path: captura("CP-VENTA-005", "02-sin-productos"),
    });

    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: captura("CP-VENTA-005", "03-validacion-resultado"),
    });

    const itemsError = page.locator("#items-error");
    await expect(itemsError).toBeVisible();
    await expect(page).toHaveURL(/sales-form/);
  });
});
