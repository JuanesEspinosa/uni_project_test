# StockManager — Guía de inicio rápido

Sistema de gestión de inventario y ventas. Backend Node.js + PostgreSQL, Frontend HTML/JS, tests E2E con Playwright.

---

## Requisitos previos

- [Node.js LTS](https://nodejs.org) (v20 o superior)
- [PostgreSQL 16](https://www.postgresql.org/download/windows)

Verificar instalaciones:

```bash
node --version   # v20.x.x
npm --version    # 10.x.x
```

---

## Estructura del proyecto

```
proyecto prueba/
├── Back/          # API REST (Express + PostgreSQL)
├── Front/         # Interfaz web (HTML/CSS/JS)
├── Docs/          # Guías detalladas de instalación
├── tests/         # Tests E2E con Playwright
├── package.json   # Scripts de tests
└── readme.md
```

---

## Configuración inicial (solo la primera vez)

### 1. Instalar dependencias del backend

```bash
cd Back
npm install
```

### 2. Configurar variables de entorno

```bash
copy .env.example .env
```

Edita `Back/.env` con tu contraseña de PostgreSQL:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password_aqui
DB_NAME=stockmanager
JWT_SECRET=stockmanager_secret_2026
PORT=3000
```

### 3. Crear la base de datos, tablas y datos de prueba

```bash
npm run db:init
```

Este comando crea la base de datos `stockmanager`, aplica el schema y carga los datos iniciales.

Salida esperada:

```
Creando base de datos "stockmanager"...
✓ Base de datos creada.
Aplicando schema...
✓ Tablas creadas.
🌱 Iniciando seed...
✓ Usuario admin creado: admin@stockmanager.com / Admin123!
✓ Clientes de ejemplo creados.
✓ Productos de ejemplo creados.
✅ Seed completado.
```

---

## Levantar el proyecto

Necesitas **2 terminales** abiertas:

### Terminal 1 — Backend

```bash
cd Back
npm run dev
```

Debe mostrar:
```
✓ Conexión a PostgreSQL establecida
✓ StockManager API corriendo en http://localhost:3000
```

### Terminal 2 — Frontend

```bash
cd Front
npx serve -l 5500 .
```

Abre en el navegador: **http://localhost:5500/login.html**

---

## Credenciales de prueba

| Campo    | Valor                      |
| -------- | -------------------------- |
| Email    | `admin@stockmanager.com`   |
| Password | `Admin123!`                |

---

## Correr los tests E2E (Playwright)

Desde la raíz del proyecto (con backend y frontend corriendo):

```bash
# Instalar dependencias (solo primera vez)
npm install
npx playwright install chromium

# Correr todos los tests (20 casos)
npm run test:headed

# Correr por módulo
npm run test:login      # Login (5 casos)
npm run test:register   # Registro (5 casos)
npm run test:products   # Productos (5 casos)
npm run test:sales      # Ventas (5 casos)

# Ver reporte HTML con capturas
npm run report
```

---

## Scripts disponibles

### Back/

| Comando           | Descripción                                          |
| ----------------- | ---------------------------------------------------- |
| `npm run db:init` | Crea BD + tablas + datos iniciales (primera vez)     |
| `npm run setup`   | Solo carga datos iniciales (si la BD ya existe)      |
| `npm run dev`     | Inicia el servidor con recarga automática (nodemon)  |
| `npm start`       | Inicia el servidor en modo producción                |

### Raíz del proyecto

| Comando                 | Descripción                        |
| ----------------------- | ---------------------------------- |
| `npm run test:headed`   | Todos los tests con navegador visible |
| `npm run test:login`    | Solo tests de login                |
| `npm run test:register` | Solo tests de registro             |
| `npm run test:products` | Solo tests de productos            |
| `npm run test:sales`    | Solo tests de ventas               |
| `npm run report`        | Abre el reporte HTML               |

---

## Puertos

| Servicio    | Puerto | URL                            |
| ----------- | ------ | ------------------------------ |
| Backend     | 3000   | http://localhost:3000          |
| Frontend    | 5500   | http://localhost:5500/login.html |
| PostgreSQL  | 5432   | localhost:5432                 |

---

## Solución de problemas

**`psql no se reconoce`** — Los scripts `db:init` usan Node.js directamente, no requieren `psql` en el PATH.

**`password authentication failed`** — Edita `Back/.env` y corrige `DB_PASSWORD` con tu contraseña de PostgreSQL.

**`EADDRINUSE :::3000`** — Ya hay un servidor corriendo. Cierra la terminal anterior o ejecuta `taskkill /F /IM node.exe`.

**`ECONNREFUSED 127.0.0.1:5500`** — El frontend no está corriendo. Levanta la Terminal 2.

Para guías detalladas de instalación ver `Docs/guia-instalacion-windows.md`.
