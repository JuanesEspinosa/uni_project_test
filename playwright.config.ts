import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  globalSetup: "./tests/global-setup.ts",
  testDir: "./tests",
  outputDir: "./evidencias/capturas-automaticas",
  reporter: [
    ["html", { outputFolder: "evidencias/reporte-html", open: "never" }],
    ["list"],
  ],
  timeout: 30000,
  workers: 1, // Un test a la vez — evita conflictos de estado en la BD
  fullyParallel: false,
  use: {
    baseURL: "http://localhost:5500", // Live Server del frontend
    screenshot: "on", // Captura automática en cada paso
    headless: false, // Browser visible (para evidencia)
    slowMo: 300, // Velocidad reducida para capturas claras
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: "Chrome",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
