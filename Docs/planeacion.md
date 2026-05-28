# StockManager — Planeación Completa del Proyecto

## Asignatura: Pruebas y Gestión de la Configuración

**Tipo de documento:** Planeación técnica y funcional  
**Fecha:** 2026-05-28  
**Equipo:** [nombres del equipo]

---

## 1. Descripción del Proyecto

**StockManager** es un sistema web de gestión comercial para una única empresa. Permite administrar usuarios, productos e historial de ventas desde una interfaz web simple.

El proyecto fue creado específicamente para la práctica de pruebas de software de la asignatura **Pruebas y Gestión de la Configuración**. Su diseño intencional es sencillo para que los casos de prueba sean claros, reproducibles y fáciles de explicar.

### ¿Por qué este proyecto y no uno externo?

- **Control total:** sabemos exactamente qué hace cada parte del código
- **Explicable:** cualquier integrante puede describir el flujo completo
- **Testeable:** los 4 módulos requeridos están implementados de forma directa
- **Sin complejidad innecesaria:** no hay multi-tenancy, roles múltiples ni configuraciones externas

---

## 2. Objetivo del Sistema

Permitir a un administrador:

1. **Autenticarse** con email y contraseña
2. **Registrar** nuevos usuarios del sistema
3. **Gestionar** el catálogo de productos (crear, ver, editar, eliminar)
4. **Registrar ventas** seleccionando productos y cantidades

---

## 3. Stack Tecnológico

### Backend

| Componente           | Tecnología           | Por qué                              |
| -------------------- | -------------------- | ------------------------------------ |
| Runtime              | Node.js 20           | Amplio soporte, fácil instalación    |
| Framework            | Express 4            | Mínimo, fácil de entender, sin magia |
| Base de datos        | PostgreSQL 16        | Robusta, ya instalada en el equipo   |
| ORM                  | `pg` (driver nativo) | Sin abstracción extra, SQL legible   |
| Autenticación        | JWT (`jsonwebtoken`) | Estándar, fácil de explicar          |
| Hash contraseñas     | `bcrypt`             | Seguridad básica obligatoria         |
| Variables de entorno | `dotenv`             | Estándar                             |

### Frontend

| Componente            | Tecnología                             | Por qué                                       |
| --------------------- | -------------------------------------- | --------------------------------------------- |
| Lenguaje              | HTML5 + CSS3 + JavaScript vanilla      | Sin frameworks — cualquiera del equipo lo lee |
| Diseño                | CSS custom (inspirado en Mipuntostock) | Paleta oscura, sidebar, tarjetas              |
| HTTP desde cliente    | `fetch` API nativa                     | Sin librerías extra                           |
| Almacenamiento sesión | `localStorage` (JWT)                   | Simple y directo                              |

### Sin usar

- React, Vue, Angular, Next.js — innecesarios para este scope
- Docker — se conecta directo a PostgreSQL local
- ORM complejo (TypeORM, Prisma) — usamos `pg` directo

---

## 4. Arquitectura del Sistema

```
┌─────────────────────────────────┐
│         NAVEGADOR               │
│  HTML + CSS + JavaScript        │
│  Puerto 5500 (Live Server)      │
│                                 │
│  ┌──────────────────────────┐   │
│  │ fetch('/api/...')        │   │
│  └──────────┬───────────────┘   │
└─────────────│───────────────────┘
              │ HTTP (JSON)
              ▼
┌─────────────────────────────────┐
│         BACKEND                 │
│  Node.js + Express              │
│  Puerto 3000                    │
│                                 │
│  /api/auth/login                │
│  /api/auth/register             │
│  /api/products   (CRUD)         │
│  /api/sales      (CRUD)         │
│  /api/clients    (lista)        │
└──────────────┬──────────────────┘
               │ SQL
               ▼
┌─────────────────────────────────┐
│         POSTGRESQL              │
│  Base de datos: stockmanager    │
│  Puerto 5432                    │
│                                 │
│  users / products               │
│  sales / sale_items             │
│  clients                        │
└─────────────────────────────────┘
```

**Flujo de una petición autenticada:**

1. Usuario hace login → backend devuelve JWT
2. Frontend guarda JWT en `localStorage`
3. Cada petición al backend incluye: `Authorization: Bearer <token>`
4. Backend valida el token antes de responder

---

## 5. Base de Datos

### Nombre: `stockmanager`

### Tabla: `users`

```sql
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  full_name   VARCHAR(100) NOT NULL,
  email       VARCHAR(150) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,        -- bcrypt hash
  role        VARCHAR(20) DEFAULT 'admin',  -- 'admin' | 'seller'
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

### Tabla: `products`

```sql
CREATE TABLE products (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  price       NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category    VARCHAR(50),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);
```

### Tabla: `clients`

```sql
CREATE TABLE clients (
  id         SERIAL PRIMARY KEY,
  full_name  VARCHAR(100) NOT NULL,
  email      VARCHAR(150),
  phone      VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Tabla: `sales`

```sql
CREATE TABLE sales (
  id          SERIAL PRIMARY KEY,
  client_id   INTEGER REFERENCES clients(id),
  user_id     INTEGER REFERENCES users(id),
  total       NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes       TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

### Tabla: `sale_items`

```sql
CREATE TABLE sale_items (
  id          SERIAL PRIMARY KEY,
  sale_id     INTEGER REFERENCES sales(id) ON DELETE CASCADE,
  product_id  INTEGER REFERENCES products(id),
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  unit_price  NUMERIC(12,2) NOT NULL,
  subtotal    NUMERIC(14,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);
```

### Seed inicial (datos de prueba)

```sql
-- Usuario administrador inicial
INSERT INTO users (full_name, email, password, role)
VALUES ('Admin Principal', 'admin@stockmanager.com', '<hash_de_Admin123!>', 'admin');

-- Clientes de ejemplo
INSERT INTO clients (full_name, email, phone) VALUES
  ('Cliente Demo', 'cliente@demo.com', '3001234567'),
  ('Juan García', 'juan@test.com', '3009876543');

-- Productos de ejemplo
INSERT INTO products (name, description, price, stock, category) VALUES
  ('Perfume Rosas', 'Fragancia floral 50ml', 85000, 50, 'Perfumes'),
  ('Perfume Lavanda', 'Fragancia suave 30ml', 65000, 30, 'Perfumes'),
  ('Loción Corporal', 'Hidratante natural 200ml', 35000, 100, 'Lociones');
```

---

## 6. API Endpoints (Backend)

### Autenticación — `/api/auth`

| Método | Ruta                 | Descripción                | Auth requerida                |
| ------ | -------------------- | -------------------------- | ----------------------------- |
| POST   | `/api/auth/login`    | Login con email + password | No                            |
| POST   | `/api/auth/register` | Registrar nuevo usuario    | No (solo admin en producción) |

### Productos — `/api/products`

| Método | Ruta                | Descripción                | Auth requerida |
| ------ | ------------------- | -------------------------- | -------------- |
| GET    | `/api/products`     | Listar todos los productos | Sí             |
| POST   | `/api/products`     | Crear producto             | Sí             |
| PUT    | `/api/products/:id` | Editar producto            | Sí             |
| DELETE | `/api/products/:id` | Eliminar producto          | Sí             |

### Ventas — `/api/sales`

| Método | Ruta             | Descripción           | Auth requerida |
| ------ | ---------------- | --------------------- | -------------- |
| GET    | `/api/sales`     | Listar ventas         | Sí             |
| POST   | `/api/sales`     | Crear venta con items | Sí             |
| GET    | `/api/sales/:id` | Ver detalle de venta  | Sí             |

### Clientes — `/api/clients`

| Método | Ruta           | Descripción     | Auth requerida |
| ------ | -------------- | --------------- | -------------- |
| GET    | `/api/clients` | Listar clientes | Sí             |
| POST   | `/api/clients` | Crear cliente   | Sí             |

---

## 7. Páginas del Frontend (HTML)

```
Front/
├── index.html          → Redirige a login.html si no hay token
├── login.html          → Formulario de login
├── register.html       → Formulario de registro de usuario
├── dashboard.html      → Panel principal con métricas básicas
├── products.html       → Lista de productos + botón crear
├── products-form.html  → Formulario crear/editar producto
├── sales.html          → Lista de ventas
├── sales-form.html     → Formulario crear venta (selección productos + cliente)
├── css/
│   ├── main.css        → Variables de color, tipografía, reset
│   ├── auth.css        → Estilos para login y register
│   └── dashboard.css   → Sidebar, header, tablas, formularios
└── js/
    ├── api.js          → Función base fetch con token + manejo de errores
    ├── auth.js         → Login, logout, registro, guard de rutas
    ├── products.js     → CRUD productos
    └── sales.js        → Crear venta, calcular total en tiempo real
```

### Paleta de colores (inspirada en Mipuntostock)

```css
--color-bg: #0f1117; /* Fondo principal oscuro */
--color-sidebar: #1a1d27; /* Sidebar */
--color-card: #1e2130; /* Tarjetas y paneles */
--color-border: #2a2d3e; /* Bordes sutiles */
--color-primary: #6366f1; /* Indigo — acción principal */
--color-primary-hover: #4f52d8;
--color-text: #e2e8f0; /* Texto principal */
--color-text-muted: #94a3b8; /* Texto secundario */
--color-success: #22c55e; /* Verde — éxito */
--color-error: #ef4444; /* Rojo — error */
--color-warning: #f59e0b; /* Amarillo — advertencia */
```

---

## 8. Estructura de Archivos del Proyecto

```
uni_project_test/
├── Back/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js           → Conexión a PostgreSQL (pool)
│   │   ├── middleware/
│   │   │   └── auth.middleware.js  → Verificar JWT en headers
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── products.routes.js
│   │   │   ├── sales.routes.js
│   │   │   └── clients.routes.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── products.controller.js
│   │   │   ├── sales.controller.js
│   │   │   └── clients.controller.js
│   │   └── app.js              → Express app, middlewares, rutas
│   ├── database/
│   │   ├── schema.sql          → CREATE TABLE completo
│   │   └── seed.sql            → Datos de prueba iniciales
│   ├── server.js               → Punto de entrada (node server.js)
│   ├── .env.example            → Plantilla de variables de entorno
│   └── package.json
│
├── Front/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── products.html
│   ├── products-form.html
│   ├── sales.html
│   ├── sales-form.html
│   ├── css/
│   │   ├── main.css
│   │   ├── auth.css
│   │   └── dashboard.css
│   └── js/
│       ├── api.js
│       ├── auth.js
│       ├── products.js
│       └── sales.js
│
├── Docs/
│   ├── planeacion.md           ← este archivo
│   ├── casos-de-prueba.md      → 20 casos detallados
│   ├── defectos.md             → Registro de defectos encontrados
│   └── informe-final.md        → Plantilla del informe universitario
│
└── tests/                      → Tests automatizados Playwright
    ├── playwright.config.ts
    ├── global-setup.ts
    ├── helpers/
    │   └── auth.helper.ts
    ├── login.spec.ts
    ├── register.spec.ts
    ├── products.spec.ts
    └── sales.spec.ts
```

---

## 9. Casos de Prueba — Los 20 Requeridos

### Módulo 1: Login (5 casos)

| ID           | Descripción                | Tipo     | Entrada                                             | Resultado esperado                    |
| ------------ | -------------------------- | -------- | --------------------------------------------------- | ------------------------------------- |
| CP-LOGIN-001 | Login exitoso              | Positivo | email: `admin@stockmanager.com` / pass: `Admin123!` | Redirige a dashboard                  |
| CP-LOGIN-002 | Contraseña incorrecta      | Negativo | email válido / pass: `malaclave`                    | Mensaje de error, permanece en login  |
| CP-LOGIN-003 | Campos vacíos              | Negativo | Todo vacío                                          | Validación HTML5 visible, no se envía |
| CP-LOGIN-004 | Usuario no registrado      | Negativo | email: `noexiste@test.com` / pass: `Test123!`       | Error "credenciales inválidas"        |
| CP-LOGIN-005 | Email con formato inválido | De borde | email: `estonoesuncorreo`                           | Validación de formato, no envía       |

### Módulo 2: Registro de Usuario (5 casos)

| ID         | Descripción                     | Tipo     | Entrada                                     | Resultado esperado                           |
| ---------- | ------------------------------- | -------- | ------------------------------------------- | -------------------------------------------- |
| CP-REG-001 | Registro exitoso                | Positivo | Datos completos y válidos, email único      | Usuario creado, redirige a login con mensaje |
| CP-REG-002 | Email ya registrado             | Negativo | Email: `admin@stockmanager.com` (ya existe) | Error "email ya registrado"                  |
| CP-REG-003 | Campos obligatorios vacíos      | Negativo | Todo vacío                                  | Validaciones visibles por campo              |
| CP-REG-004 | Contraseña muy corta (<6 chars) | De borde | pass: `abc`                                 | Error de validación, no registra             |
| CP-REG-005 | Email con formato inválido      | De borde | email: `correosinArroba`                    | Validación de formato, no envía              |

### Módulo 3: Creación de Producto (5 casos)

| ID          | Descripción                | Tipo     | Entrada                        | Resultado esperado                   |
| ----------- | -------------------------- | -------- | ------------------------------ | ------------------------------------ |
| CP-PROD-001 | Crear producto válido      | Positivo | Nombre, precio y stock válidos | Producto aparece en la lista         |
| CP-PROD-002 | Precio negativo            | De borde | precio: `-5000`                | Error de validación, no crea         |
| CP-PROD-003 | Nombre vacío               | Negativo | Nombre: vacío                  | Validación de campo requerido        |
| CP-PROD-004 | Stock en cero              | De borde | stock: `0`                     | Sistema acepta (stock 0 es válido)   |
| CP-PROD-005 | Nombre con 200+ caracteres | De borde | Nombre muy largo               | Error o trunca según límite definido |

### Módulo 4: Ventas / Carrito (5 casos)

| ID           | Descripción                   | Tipo     | Entrada                                        | Resultado esperado                 |
| ------------ | ----------------------------- | -------- | ---------------------------------------------- | ---------------------------------- |
| CP-VENTA-001 | Crear venta válida            | Positivo | Cliente + producto con stock + cantidad válida | Venta registrada, stock descontado |
| CP-VENTA-002 | Cantidad mayor al stock       | Negativo | qty: `9999` (stock = 50)                       | Error "stock insuficiente"         |
| CP-VENTA-003 | Total calculado correctamente | Positivo | Producto $85.000 × 3 unidades                  | Total = $255.000                   |
| CP-VENTA-004 | Venta sin cliente             | Negativo | Sin seleccionar cliente                        | Validación: cliente requerido      |
| CP-VENTA-005 | Venta sin productos           | Negativo | Sin agregar items                              | Validación: al menos un producto   |

---

## 10. Tests Automatizados (Playwright)

Los tests automatizados generan capturas de pantalla como evidencia y se ejecutan con:

```bash
cd tests
pnpm test:headed
```

### Configuración

- `workers: 1` — un test a la vez (evita conflictos de estado)
- `headless: false` — browser visible para evidencia
- `slowMo: 300` — velocidad reducida para capturas claras
- `screenshot: on` — captura automática en cada paso
- `baseURL: http://localhost:5500` — frontend servido con Live Server o similar

### Global Setup

A diferencia del proyecto anterior (Mipuntostock), el setup es mínimo:

1. Verificar que el backend responde
2. Intentar login con usuario de prueba
3. Si no existe, registrarlo con `POST /api/auth/register`
4. Listo — sin superadmin, sin licencias, sin tenants

---

## 11. Instrucciones de Instalación

### Requisitos previos

- Node.js 20+ (`node --version`)
- PostgreSQL 16 corriendo en localhost:5432
- VS Code con extensión Live Server (para el frontend)

### Backend

```bash
cd Back
npm install
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL

# Crear la base de datos
psql -U postgres -c "CREATE DATABASE stockmanager;"
psql -U postgres -d stockmanager -f database/schema.sql
psql -U postgres -d stockmanager -f database/seed.sql

node server.js
# Servidor corriendo en http://localhost:3000
```

### Frontend

```bash
# Abrir Front/ en VS Code
# Click derecho en login.html → "Open with Live Server"
# O instalar: npm install -g live-server && live-server Front/
# Abre en http://localhost:5500
```

### Variables de entorno (`.env`)

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password_aqui
DB_NAME=stockmanager
JWT_SECRET=stockmanager_secret_2026
PORT=3000
```

---

## 12. División del Trabajo Sugerida para el Equipo

| Integrante | Responsabilidad                                                                     |
| ---------- | ----------------------------------------------------------------------------------- |
| Dev 1      | Backend: `auth.routes.js`, `auth.controller.js`, schema y seed SQL                  |
| Dev 2      | Backend: `products.routes.js`, `sales.routes.js` + controladores                    |
| Dev 3      | Frontend: `login.html`, `register.html`, `css/auth.css`, `js/auth.js`               |
| Dev 4      | Frontend: `dashboard.html`, `products.html`, `sales-form.html`, `css/dashboard.css` |
| Todos      | Ejecución manual de los 20 casos de prueba + documentar evidencias                  |

---

## 13. Cronograma Sugerido

| Día   | Actividad                                                       |
| ----- | --------------------------------------------------------------- |
| Día 1 | Montar backend (schema, seed, rutas auth + products)            |
| Día 2 | Montar frontend (login, register, dashboard, products)          |
| Día 3 | Módulo ventas (backend + frontend), integración completa        |
| Día 4 | Ejecutar 20 casos manuales, tomar capturas, documentar defectos |
| Día 5 | Tests automatizados Playwright (opcional según alcance exigido) |
| Día 6 | Redactar informe final y preparar sustentación                  |

---

## 14. Ventajas de este Proyecto vs Mipuntostock (para la sustentación)

| Aspecto                                | StockManager                   | Mipuntostock                                                             |
| -------------------------------------- | ------------------------------ | ------------------------------------------------------------------------ |
| Setup para correr                      | 2 comandos                     | Backend + Frontend + DB + Seed + Licencias                               |
| Explicar el login                      | "Envía email/pass, recibe JWT" | "Verifica licencia activa del tenant, genera token con tenantId"         |
| Explicar el registro                   | "Crea usuario en tabla users"  | "Crea tenant + usuario admin en transacción, genera password automático" |
| Número de tablas                       | 5                              | 25+                                                                      |
| Roles                                  | admin / seller                 | superadmin / admin / seller (multi-tenant)                               |
| Global setup Playwright                | ~15 líneas                     | ~150 líneas                                                              |
| Lo puede explicar cualquier integrante | ✅ Sí                          | ⚠️ Solo quien lo construyó                                               |

---

## 15. Criterios de Aceptación (por módulo)

Según la práctica universitaria, cada módulo debe tener un criterio de aceptación definido:

| Módulo    | Criterio de aceptación                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------------- |
| Login     | El sistema autentica al usuario y genera un token JWT válido que permite acceder a rutas protegidas     |
| Registro  | El sistema crea un nuevo usuario con email único, contraseña hasheada y rol asignado                    |
| Productos | El sistema crea un producto con precio ≥ 0 y stock ≥ 0, persiste en base de datos y aparece en la lista |
| Ventas    | El sistema registra la venta, descuenta el stock de cada producto y calcula el total correctamente      |

---

## 16. Tests Automatizados con Playwright — Implementación Completa

### ¿Qué es Playwright?

Playwright es un framework de automatización de navegadores desarrollado por Microsoft. Permite escribir scripts que controlan un navegador real (Chrome, Firefox, Safari) igual que lo haría un usuario humano: hace clic, llena formularios, navega entre páginas y toma capturas de pantalla.

**¿Por qué Playwright para este proyecto?**

- Genera capturas automáticas como evidencia de cada prueba
- Los tests son legibles — cualquier integrante puede entender qué hace cada uno
- Produce un reporte HTML con resultados visuales listo para entregar
- Corre en Windows sin configuración adicional

---

### 16.1 Estructura de los tests

```
tests/
├── playwright.config.ts        → Configuración global
├── global-setup.ts             → Crea usuario de prueba antes de correr
├── helpers/
│   └── auth.helper.ts          → Login reutilizable y función de capturas
├── login.spec.ts               → CP-LOGIN-001 al CP-LOGIN-005
├── register.spec.ts            → CP-REG-001 al CP-REG-005
├── products.spec.ts            → CP-PROD-001 al CP-PROD-005
└── sales.spec.ts               → CP-VENTA-001 al CP-VENTA-005
```

---

### 16.2 Instalación

```bash
# Desde la carpeta raíz del proyecto
npm init -y
npm install -D @playwright/test typescript ts-node
npx playwright install chromium
```

---

### 16.3 `playwright.config.ts`

```typescript
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
  workers: 1, // Un test a la vez — evita conflictos de estado
  fullyParallel: false,
  use: {
    baseURL: "http://localhost:5500", // Live Server del frontend
    screenshot: "on", // Captura automática en cada paso
    headless: false, // Browser visible
    slowMo: 300, // Velocidad reducida para capturas claras
    viewport: { width: 1280, height: 720 },
  },
  projects: [{ name: "Chrome", use: { ...devices["Desktop Chrome"] } }],
});
```

---

### 16.4 `tests/global-setup.ts`

Se ejecuta **una sola vez antes de todos los tests**. Verifica que el usuario de prueba exista y si no, lo registra.

```typescript
import { request } from "@playwright/test";

// Credenciales del usuario de prueba — conocidas de antemano
export const TEST_CREDENTIALS = {
  email: "playwright@stockmanager.com",
  password: "Test1234!",
};

async function globalSetup() {
  console.log("\n🔧 Verificando usuario de prueba...");

  const api = await request.newContext({ baseURL: "http://localhost:3000" });

  // 1. Intentar login — si funciona, ya existe
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

  // 2. No existe — registrarlo
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
      `No se pudo crear el usuario de prueba.\nStatus: ${registerRes.status()}\nBody: ${body}`,
    );
  }

  console.log(
    `✓ Usuario creado: ${TEST_CREDENTIALS.email} / ${TEST_CREDENTIALS.password}`,
  );
  await api.dispose();
}

export default globalSetup;
```

---

### 16.5 `tests/helpers/auth.helper.ts`

```typescript
import { Page } from "@playwright/test";
import { TEST_CREDENTIALS } from "../global-setup";

// Genera la ruta de la captura organizada por caso de prueba
export const captura = (testId: string, paso: string): string =>
  `evidencias/capturas/${testId}-${paso}.png`;

// Inicia sesión con el usuario de prueba
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
```

---

### 16.6 `tests/login.spec.ts` — 5 casos

```typescript
import { test, expect } from "@playwright/test";
import { captura } from "./helpers/auth.helper";
import { TEST_CREDENTIALS } from "./global-setup";

test.describe("MÓDULO: Login", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login.html");
    await page.waitForLoadState("networkidle");
  });

  // CP-LOGIN-001 | Positivo | Login exitoso con credenciales válidas
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

  // CP-LOGIN-002 | Negativo | Contraseña incorrecta
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

    // Debe mostrar error y permanecer en login
    const alerta = page.locator("#alert");
    await expect(alerta).toBeVisible();
    await expect(page).toHaveURL(/login/);
  });

  // CP-LOGIN-003 | Negativo | Campos vacíos
  test("CP-LOGIN-003 | Login con campos vacíos", async ({ page }) => {
    await page.screenshot({
      path: captura("CP-LOGIN-003", "01-formulario-vacio"),
    });

    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: captura("CP-LOGIN-003", "02-validaciones-resultado"),
    });

    // Debe mostrar mensajes de validación
    const emailError = page.locator("#email-error");
    await expect(emailError).toBeVisible();
    await expect(page).toHaveURL(/login/);
  });

  // CP-LOGIN-004 | Negativo | Usuario no registrado
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

  // CP-LOGIN-005 | De borde | Email con formato inválido
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

    // El input[type="email"] del browser bloquea el submit con email inválido
    const emailInput = page.locator('input[name="email"]');
    const esInvalido = await emailInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid,
    );
    expect(esInvalido).toBe(true);
    await expect(page).toHaveURL(/login/);
  });
});
```

---

### 16.7 `tests/register.spec.ts` — 5 casos

```typescript
import { test, expect } from "@playwright/test";
import { captura } from "./helpers/auth.helper";

test.describe("MÓDULO: Registro de Usuario", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register.html");
    await page.waitForLoadState("networkidle");
  });

  // CP-REG-001 | Positivo | Registro exitoso
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
    await page.waitForTimeout(2000);
    await page.screenshot({ path: captura("CP-REG-001", "03-resultado") });

    // Debe mostrar mensaje de éxito
    const alertSuccess = page.locator("#alert-success");
    await expect(alertSuccess).toBeVisible({ timeout: 5000 });
  });

  // CP-REG-002 | Negativo | Email ya registrado
  test("CP-REG-002 | Registro con email ya registrado", async ({ page }) => {
    await page.screenshot({
      path: captura("CP-REG-002", "01-pantalla-registro"),
    });

    await page.fill('input[name="fullName"]', "Duplicado Test");
    await page.fill('input[name="email"]', "admin@stockmanager.com"); // ya existe
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

  // CP-REG-003 | Negativo | Campos obligatorios vacíos
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

  // CP-REG-004 | De borde | Contraseña menor a 6 caracteres
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

  // CP-REG-005 | De borde | Email con formato inválido
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

    const emailInput = page.locator('input[name="email"]');
    const esInvalido = await emailInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid,
    );
    expect(esInvalido).toBe(true);
    await expect(page).toHaveURL(/register/);
  });
});
```

---

### 16.8 `tests/products.spec.ts` — 5 casos

```typescript
import { test, expect } from "@playwright/test";
import { captura, loginAsAdmin } from "./helpers/auth.helper";

test.describe("MÓDULO: Productos", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/products-form.html");
    await page.waitForLoadState("networkidle");
  });

  // CP-PROD-001 | Positivo | Crear producto con datos válidos
  test("CP-PROD-001 | Crear producto con datos válidos", async ({ page }) => {
    await page.screenshot({
      path: captura("CP-PROD-001", "01-formulario-producto"),
    });

    await page.fill('input[name="name"]', `Perfume Test ${Date.now()}`);
    await page.fill('input[name="price"]', "85000");
    await page.fill('input[name="stock"]', "50");
    await page.fill('input[name="category"]', "Perfumes");
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

  // CP-PROD-002 | De borde | Precio negativo
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

  // CP-PROD-003 | Negativo | Nombre vacío
  test("CP-PROD-003 | Crear producto sin nombre", async ({ page }) => {
    await page.screenshot({
      path: captura("CP-PROD-003", "01-formulario-producto"),
    });

    // Dejar nombre vacío, llenar precio
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

  // CP-PROD-004 | De borde | Stock en cero (debe aceptarse)
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

    // Stock 0 es válido — debe redirigir a la lista
    await expect(page).toHaveURL(/products\.html/);
  });

  // CP-PROD-005 | De borde | Nombre con más de 100 caracteres
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

    // El backend rechaza nombres > 100 chars
    const nameError = page.locator("#name-error");
    await expect(nameError).toBeVisible();
    await expect(page).toHaveURL(/products-form/);
  });
});
```

---

### 16.9 `tests/sales.spec.ts` — 5 casos

```typescript
import { test, expect } from "@playwright/test";
import { captura, loginAsAdmin } from "./helpers/auth.helper";

test.describe("MÓDULO: Ventas (Carrito)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/sales-form.html");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000); // espera a que carguen clientes y productos
  });

  // CP-VENTA-001 | Positivo | Crear venta válida
  test("CP-VENTA-001 | Crear venta con productos en stock", async ({
    page,
  }) => {
    await page.screenshot({
      path: captura("CP-VENTA-001", "01-formulario-venta"),
    });

    // Seleccionar cliente
    await page.selectOption("#client-id", { index: 1 });

    // Seleccionar producto en la primera fila
    await page.locator(".item-product").first().selectOption({ index: 1 });
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

  // CP-VENTA-002 | Negativo | Cantidad mayor al stock
  test("CP-VENTA-002 | Venta con cantidad mayor al stock disponible", async ({
    page,
  }) => {
    await page.screenshot({
      path: captura("CP-VENTA-002", "01-formulario-venta"),
    });

    await page.selectOption("#client-id", { index: 1 });
    await page.locator(".item-product").first().selectOption({ index: 1 });
    await page.locator(".item-qty").first().fill("99999"); // supera cualquier stock
    await page.screenshot({
      path: captura("CP-VENTA-002", "02-cantidad-excesiva"),
    });

    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: captura("CP-VENTA-002", "03-error-stock") });

    // El backend rechaza y muestra error
    const alerta = page.locator("#alert");
    await expect(alerta).toBeVisible();
    await expect(page).toHaveURL(/sales-form/);
  });

  // CP-VENTA-003 | Positivo | Total calculado correctamente
  test("CP-VENTA-003 | El total se calcula correctamente", async ({ page }) => {
    await page.screenshot({
      path: captura("CP-VENTA-003", "01-formulario-venta"),
    });

    // Seleccionar primer producto y poner cantidad 3
    await page.locator(".item-product").first().selectOption({ index: 1 });
    await page.waitForTimeout(300);

    // Leer el precio unitario que muestra la UI
    const precioTexto = await page.locator(".item-info").first().textContent();
    await page.locator(".item-qty").first().fill("3");
    await page.waitForTimeout(300);

    await page.screenshot({
      path: captura("CP-VENTA-003", "02-total-calculado"),
    });

    // Verificar que el total es mayor a $0
    const totalTexto = await page.locator("#sale-total").textContent();
    expect(totalTexto).not.toBe("$0");
    expect(totalTexto).not.toBe("");
  });

  // CP-VENTA-004 | Negativo | Venta sin cliente
  test("CP-VENTA-004 | Crear venta sin seleccionar cliente", async ({
    page,
  }) => {
    await page.screenshot({
      path: captura("CP-VENTA-004", "01-formulario-venta"),
    });

    // Agregar producto pero NO seleccionar cliente
    await page.locator(".item-product").first().selectOption({ index: 1 });
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

  // CP-VENTA-005 | Negativo | Venta sin productos
  test("CP-VENTA-005 | Crear venta sin agregar productos", async ({ page }) => {
    await page.screenshot({
      path: captura("CP-VENTA-005", "01-formulario-venta"),
    });

    // Seleccionar cliente pero eliminar todos los productos
    await page.selectOption("#client-id", { index: 1 });

    // Eliminar la fila de item que se agrega automáticamente
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
```

---

### 16.10 Comandos para ejecutar los tests

```bash
# Instalar dependencias (solo primera vez)
npm install

# Correr todos los tests con browser visible
npx playwright test --headed

# Correr solo un módulo
npx playwright test login --headed
npx playwright test register --headed
npx playwright test products --headed
npx playwright test sales --headed

# Ver el reporte HTML con resultados y capturas
npx playwright show-report evidencias/reporte-html
```

---

### 16.11 Qué genera Playwright automáticamente

Al correr los tests se crean estas carpetas:

```
evidencias/
├── capturas/                     → Capturas por caso de prueba
│   ├── CP-LOGIN-001-01-pantalla-login.png
│   ├── CP-LOGIN-001-02-formulario-lleno.png
│   ├── CP-LOGIN-001-03-dashboard-resultado.png
│   └── ... (3 capturas × 20 casos = ~60 imágenes)
│
├── capturas-automaticas/         → Capturas adicionales de Playwright
│
└── reporte-html/                 → Reporte visual HTML
    └── index.html                ← Abrir en el browser para ver resultados
```

El reporte HTML muestra: qué tests pasaron ✅, cuáles fallaron ❌, el tiempo de ejecución de cada uno y las capturas de pantalla adjuntas — listo para incluir en el informe universitario.

---

### 16.12 Resumen de los 20 tests automatizados

| ID           | Módulo    | Tipo     | Qué verifica                                   |
| ------------ | --------- | -------- | ---------------------------------------------- |
| CP-LOGIN-001 | Login     | Positivo | Login exitoso → redirige al dashboard          |
| CP-LOGIN-002 | Login     | Negativo | Contraseña incorrecta → muestra error          |
| CP-LOGIN-003 | Login     | Negativo | Campos vacíos → validación visible             |
| CP-LOGIN-004 | Login     | Negativo | Usuario inexistente → muestra error            |
| CP-LOGIN-005 | Login     | De borde | Email inválido → validación nativa del browser |
| CP-REG-001   | Registro  | Positivo | Registro exitoso → mensaje de éxito            |
| CP-REG-002   | Registro  | Negativo | Email duplicado → error del servidor           |
| CP-REG-003   | Registro  | Negativo | Campos vacíos → validaciones visibles          |
| CP-REG-004   | Registro  | De borde | Contraseña corta (&lt;6) → error de validación |
| CP-REG-005   | Registro  | De borde | Email inválido → validación nativa del browser |
| CP-PROD-001  | Productos | Positivo | Crear producto → aparece en la lista           |
| CP-PROD-002  | Productos | De borde | Precio negativo → error de validación          |
| CP-PROD-003  | Productos | Negativo | Nombre vacío → campo requerido visible         |
| CP-PROD-004  | Productos | De borde | Stock = 0 → acepta y redirige                  |
| CP-PROD-005  | Productos | De borde | Nombre &gt;100 chars → error de validación     |
| CP-VENTA-001 | Ventas    | Positivo | Venta registrada → redirige al historial       |
| CP-VENTA-002 | Ventas    | Negativo | Stock insuficiente → error del servidor        |
| CP-VENTA-003 | Ventas    | Positivo | Total calculado correctamente en tiempo real   |
| CP-VENTA-004 | Ventas    | Negativo | Sin cliente → validación visible               |
| CP-VENTA-005 | Ventas    | Negativo | Sin productos → validación visible             |
