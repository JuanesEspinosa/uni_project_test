import { request } from "@playwright/test";

/**
 * Usuario de prueba dedicado para Playwright.
 * Se crea automáticamente antes de correr cualquier test.
 * Credenciales fijas y conocidas de antemano.
 */
export const TEST_CREDENTIALS = {
  email: "playwright@stockmanager.com",
  password: "Test1234!",
};

/** Productos originales del seed — no deben eliminarse y su stock se restaura */
const SEED_PRODUCTS = [
  { name: "Perfume Rosas",   originalStock: 50  },
  { name: "Perfume Lavanda", originalStock: 30  },
  { name: "Loción Corporal", originalStock: 100 },
  { name: "Agua de Colonia", originalStock: 20  },
  { name: "Crema de Manos",  originalStock: 80  },
];

async function globalSetup() {
  console.log("\n🔧 Setup global — verificando usuario de prueba...");

  const api = await request.newContext({ baseURL: "http://localhost:3000" });

  // ── 1. Obtener token de admin para limpieza de BD ───────────────────
  const adminLogin = await api.post("/api/auth/login", {
    data: { email: "admin@stockmanager.com", password: "Admin123!" },
  });
  let adminToken: string | null = null;
  if (adminLogin.ok()) {
    const body = await adminLogin.json();
    adminToken = body.token;
  }

  // ── 2. Limpiar productos creados por tests anteriores ───────────────
  if (adminToken) {
    const authHeaders = { Authorization: `Bearer ${adminToken}` };
    const productsRes = await api.get("/api/products", { headers: authHeaders });
    if (productsRes.ok()) {
      const products: Array<{ id: number; name: string; stock: number }> =
        await productsRes.json();

      const seedNames = new Set(SEED_PRODUCTS.map((p) => p.name));

      for (const product of products) {
        if (!seedNames.has(product.name)) {
          // No es del seed — eliminar
          await api.delete(`/api/products/${product.id}`, { headers: authHeaders });
        }
      }

      // Restaurar stocks de productos del seed
      for (const product of products) {
        const seed = SEED_PRODUCTS.find((s) => s.name === product.name);
        if (seed && product.stock !== seed.originalStock) {
          await api.put(`/api/products/${product.id}`, {
            headers: authHeaders,
            data: { ...product, stock: seed.originalStock },
          });
        }
      }
    }
    console.log("✓ Base de datos limpia — productos de prueba eliminados");
  }

  // ── 3. Verificar / crear usuario de prueba de Playwright ────────────
  const loginRes = await api.post("/api/auth/login", {
    data: {
      email: TEST_CREDENTIALS.email,
      password: TEST_CREDENTIALS.password,
    },
  });

  if (loginRes.ok()) {
    console.log(`✓ Usuario de prueba ya existe: ${TEST_CREDENTIALS.email}`);
    await api.dispose();
    return;
  }

  console.log(`  Creando usuario: ${TEST_CREDENTIALS.email}...`);

  const registerRes = await api.post("/api/auth/register", {
    data: {
      fullName: "Admin Playwright",
      email: TEST_CREDENTIALS.email,
      password: TEST_CREDENTIALS.password,
    },
  });

  if (!registerRes.ok()) {
    const body = await registerRes.text();
    throw new Error(
      `No se pudo crear el usuario de prueba.\n` +
        `Status: ${registerRes.status()}\n` +
        `Body: ${body}\n\n` +
        `Asegúrate de que el backend esté corriendo: cd Back && npm run dev`,
    );
  }

  console.log(
    `✓ Usuario creado: ${TEST_CREDENTIALS.email} / ${TEST_CREDENTIALS.password}`,
  );
  await api.dispose();
}

export default globalSetup;
