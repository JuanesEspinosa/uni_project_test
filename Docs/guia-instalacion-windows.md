# Guía de Instalación — Windows 10 / 11

## StockManager — Práctica de Pruebas Universitaria

**Sistema operativo:** Windows 10 (versión 1903 o superior) / Windows 11  
**Fecha:** 2026-05-28

---

## Índice

1. [Instalar Node.js](#1-instalar-nodejs)
2. [Instalar PostgreSQL](#2-instalar-postgresql)
3. [Obtener el proyecto](#3-obtener-el-proyecto)
4. [Configurar el Backend](#4-configurar-el-backend)
5. [Levantar el Frontend](#5-levantar-el-frontend)
6. [Instalar y correr los tests de Playwright](#6-instalar-y-correr-los-tests-de-playwright)
7. [Verificar que todo funciona](#7-verificar-que-todo-funciona)
8. [Comandos de referencia rápida](#8-comandos-de-referencia-rápida)
9. [Solución de problemas comunes](#9-solución-de-problemas-comunes)

---

## 1. Instalar Node.js

### 1.1 Descargar el instalador

1. Ve a **https://nodejs.org**
2. Descarga la versión **LTS** (la que dice "Recommended For Most Users")
3. Ejecuta el instalador `.msi` descargado
4. Acepta todos los valores por defecto — **no cambies nada**
5. En la pantalla _"Tools for Native Modules"_, marca la casilla si aparece

### 1.2 Verificar la instalación

Abre **PowerShell** o **CMD** y ejecuta:

```powershell
node --version
# Debe mostrar: v20.x.x

npm --version
# Debe mostrar: 10.x.x
```

> **Si el comando no se reconoce:** cierra y vuelve a abrir la terminal. Windows necesita reiniciar la sesión para detectar las variables de entorno nuevas.

---

## 2. Instalar PostgreSQL

### 2.1 Descargar el instalador

1. Ve a **https://www.postgresql.org/download/windows**
2. Haz clic en **"Download the installer"**
3. Descarga la versión **16.x** para Windows x86-64
4. Ejecuta el instalador `.exe`

### 2.2 Configurar durante la instalación

Sigue el instalador con estos valores:

| Pantalla               | Valor a usar                                |
| ---------------------- | ------------------------------------------- |
| Installation Directory | Dejar el valor por defecto                  |
| Select Components      | Dejar todo marcado                          |
| Data Directory         | Dejar el valor por defecto                  |
| **Password**           | **`postgres`** ← anótalo, lo usarás siempre |
| Port                   | `5432` (por defecto)                        |
| Locale                 | Dejar por defecto                           |

> **Importante:** La contraseña que pongas aquí es la del superusuario `postgres`. Usa `postgres` para que coincida con la configuración del proyecto.

### 2.3 Finalizar la instalación

Al terminar, el instalador preguntará si quieres abrir **Stack Builder** — puedes decir **No**.

### 2.4 Verificar PostgreSQL

Abre **SQL Shell (psql)** desde el menú de inicio (lo instala PostgreSQL automáticamente):

```
Server [localhost]: (Enter)
Database [postgres]: (Enter)
Port [5432]: (Enter)
Username [postgres]: (Enter)
Password for user postgres: postgres
```

Si entras sin error, PostgreSQL está funcionando. Escribe `\q` para salir.

### 2.5 Agregar PostgreSQL al PATH (para usar psql desde CMD/PowerShell)

1. Abre el menú de inicio → busca **"Variables de entorno"** → _"Editar las variables de entorno del sistema"_
2. Haz clic en **"Variables de entorno..."**
3. En _"Variables del sistema"_, selecciona **Path** → **Editar**
4. Haz clic en **Nuevo** y agrega:
   ```
   C:\Program Files\PostgreSQL\16\bin
   ```
5. Acepta todo con **Aceptar**
6. **Cierra y vuelve a abrir** la terminal

Verificar:

```powershell
psql --version
# Debe mostrar: psql (PostgreSQL) 16.x
```

---

## 3. Obtener el proyecto

### Opción A — Desde un repositorio Git

```powershell
git clone https://github.com/tu-usuario/stockmanager.git
cd stockmanager
```

> Si no tienes Git instalado: descárgalo en **https://git-scm.com/download/win** e instálalo con los valores por defecto.

### Opción B — Desde un archivo ZIP

1. Descomprime el `.zip` en una carpeta de tu elección (ej: `C:\Proyectos\stockmanager`)
2. Abre PowerShell en esa carpeta:
   - Navega hasta la carpeta en el Explorador de archivos
   - Haz clic derecho en un espacio vacío → **"Abrir en Terminal"** o **"Abrir ventana de PowerShell aquí"**

Estructura que debes ver al hacer `dir`:

```
uni_project_test/
├── Back/
├── Front/
├── Docs/
├── tests/
├── package.json
├── playwright.config.ts
└── tsconfig.json
```

---

## 4. Configurar el Backend

Abre una terminal (PowerShell o CMD) en la carpeta `uni_project_test/Back`.

### 4.1 Instalar dependencias

```powershell
npm install
```

### 4.2 Crear el archivo de variables de entorno

```powershell
copy .env.example .env
```

Abre el archivo `.env` con el Bloc de notas o VS Code y verifica que tenga estos valores:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=stockmanager
JWT_SECRET=stockmanager_secret_2026
PORT=3000
```

Guarda el archivo.

### 4.3 Crear la base de datos

```powershell
psql -U postgres -h localhost -c "CREATE DATABASE stockmanager;"
```

Te pedirá la contraseña: **`postgres`**

### 4.4 Crear las tablas

```powershell
psql -U postgres -h localhost -d stockmanager -f database/schema.sql
```

Debes ver:

```
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
```

### 4.5 Poblar con datos de prueba

```powershell
node database/seed.js
```

Salida esperada:

```
🌱 Iniciando seed...
✓ Usuario admin creado: admin@stockmanager.com / Admin123!
✓ Clientes de ejemplo creados.
✓ Productos de ejemplo creados.

✅ Seed completado.
   Credenciales de prueba:
   Email:    admin@stockmanager.com
   Password: Admin123!
```

### 4.6 Levantar el servidor backend

```powershell
npm run dev
```

Debes ver:

```
✓ Conexión a PostgreSQL establecida
✓ StockManager API corriendo en http://localhost:3000
```

> **Deja esta terminal abierta.** El backend debe seguir corriendo mientras usas el proyecto.

---

## 5. Levantar el Frontend

Tienes dos opciones. Elige la que prefieras:

### Opción A — VS Code con Live Server (recomendada si ya tienes VS Code)

1. Abre VS Code
2. Abre la carpeta `uni_project_test/Front`
3. Instala la extensión **Live Server** de Ritwick Dey (si no la tienes):
   - Ctrl + Shift + X → busca "Live Server" → Instalar
4. Haz clic derecho sobre `login.html` en el explorador de archivos de VS Code
5. Selecciona **"Open with Live Server"**
6. Se abrirá automáticamente `http://localhost:5500/login.html`

### Opción B — Desde la terminal (sin VS Code)

Abre una **nueva terminal** en `uni_project_test/Front`:

```powershell
npx serve -l 5500 .
```

Luego abre el navegador en: **http://localhost:5500/login.html**

---

## 6. Instalar y correr los tests de Playwright

Abre una **nueva terminal** en la carpeta raíz `uni_project_test/`.

### 6.1 Instalar dependencias

```powershell
npm install
```

### 6.2 Instalar el navegador Chromium

```powershell
npx playwright install chromium
```

Descarga unos 150MB — espera a que termine.

### 6.3 Correr todos los tests

Asegúrate de que el backend (puerto 3000) y el frontend (puerto 5500) estén corriendo:

```powershell
npm run test:headed
```

Verás Chrome abrirse automáticamente y ejecutar los 20 casos de prueba uno a uno.

### 6.4 Correr un módulo específico

```powershell
npm run test:login      # Solo CP-LOGIN-001 al 005
npm run test:register   # Solo CP-REG-001 al 005
npm run test:products   # Solo CP-PROD-001 al 005
npm run test:sales      # Solo CP-VENTA-001 al 005
```

### 6.5 Ver el reporte HTML con resultados y capturas

```powershell
npm run report
```

Se abrirá automáticamente en el navegador con todos los resultados y las capturas de pantalla de cada caso.

---

## 7. Verificar que todo funciona

### Checklist antes de correr los tests

| Elemento                | Cómo verificar                                                                                        |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| Node.js instalado       | `node --version` → `v20.x.x`                                                                          |
| PostgreSQL corriendo    | Abre **Servicios** (Win + R → `services.msc`) → busca `postgresql-x64-16` → debe decir _En ejecución_ |
| Backend en puerto 3000  | Abre `http://localhost:3000` en el navegador → debe mostrar `{"status":"ok"}`                         |
| Frontend en puerto 5500 | Abre `http://localhost:5500/login.html` → debe mostrar la pantalla de login                           |
| Datos en la BD          | Corre `node database/seed.js` → debe decir que los datos ya existen                                   |

### Probar el backend desde PowerShell

```powershell
# Verificar que el servidor responde
Invoke-WebRequest -Uri "http://localhost:3000" | Select-Object -ExpandProperty Content

# Probar login
$body = '{"email":"admin@stockmanager.com","password":"Admin123!"}'
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" -Method POST -ContentType "application/json" -Body $body | Select-Object -ExpandProperty Content
```

---

## 8. Comandos de referencia rápida

### Las 3 terminales que necesitas abiertas

```powershell
# Terminal 1 — Backend (carpeta Back/)
npm run dev

# Terminal 2 — Frontend (carpeta Front/)
npx serve -l 5500 .

# Terminal 3 — Tests (carpeta uni_project_test/)
npm run test:headed
```

### PostgreSQL desde PowerShell

```powershell
# Conectarse a la base de datos
psql -U postgres -h localhost -d stockmanager

# Ver tablas (dentro de psql)
\dt

# Ver usuarios registrados (dentro de psql)
SELECT id, email, role FROM users;

# Salir de psql
\q
```

### Recrear la base de datos desde cero

```powershell
# Eliminar y recrear (desde la carpeta Back/)
psql -U postgres -h localhost -c "DROP DATABASE IF EXISTS stockmanager;"
psql -U postgres -h localhost -c "CREATE DATABASE stockmanager;"
psql -U postgres -h localhost -d stockmanager -f database/schema.sql
node database/seed.js
```

---

## 9. Solución de problemas comunes

### ❌ `'node' no se reconoce como un comando interno o externo`

**Causa:** Node.js no quedó en el PATH de Windows.

**Solución:**

1. Desinstala Node.js desde _Agregar o quitar programas_
2. Reinicia el equipo
3. Instala Node.js de nuevo desde **https://nodejs.org**
4. Abre una nueva terminal y verifica con `node --version`

---

### ❌ `'psql' no se reconoce como un comando interno o externo`

**Causa:** La carpeta `bin` de PostgreSQL no está en el PATH.

**Solución:** Agrega `C:\Program Files\PostgreSQL\16\bin` al PATH del sistema (ver paso 2.5) y cierra/abre la terminal.

---

### ❌ `password authentication failed for user "postgres"`

**Causa:** La contraseña en el `.env` no coincide con la que pusiste al instalar PostgreSQL.

**Solución:** Edita `Back/.env` y pon la contraseña correcta en `DB_PASSWORD`.

Si olvidaste la contraseña:

1. Abre SQL Shell (psql) desde el menú de inicio (usa autenticación de Windows)
2. Ejecuta: `ALTER USER postgres PASSWORD 'postgres';`

---

### ❌ `Error: listen EADDRINUSE :::3000`

**Causa:** El puerto 3000 ya está en uso (otra instancia del backend corriendo).

**Solución:**

```powershell
# Ver qué proceso usa el puerto 3000
netstat -ano | findstr :3000

# Matar el proceso (reemplaza PID con el número que aparece en la última columna)
taskkill /PID <PID> /F
```

---

### ❌ `Error: listen EADDRINUSE :::5500`

**Causa:** El puerto 5500 ya está en uso (Live Server u otro servidor corriendo).

**Solución:** Cierra VS Code completamente o el proceso que use ese puerto, y vuelve a levantar el frontend.

---

### ❌ Playwright: `Error: connect ECONNREFUSED 127.0.0.1:5500`

**Causa:** El frontend no está corriendo.

**Solución:** Abre una terminal en `Front/` y ejecuta:

```powershell
npx serve -l 5500 .
```

---

### ❌ Playwright: `browserType.launch: Executable doesn't exist`

**Causa:** No se descargó Chromium.

**Solución:**

```powershell
npx playwright install chromium
```

---

### ❌ `cannot open server "localhost": No such file or directory` en psql

**Causa:** psql intenta conectarse por socket en lugar de TCP/IP.

**Solución:** Siempre agrega `-h localhost` al comando psql:

```powershell
psql -U postgres -h localhost -d stockmanager
```

---

### ❌ Antivirus bloquea Node.js o Playwright

**Causa:** Algunos antivirus (Windows Defender, Avast) bloquean la ejecución de binarios descargados.

**Solución:**

1. Abre Windows Defender → _Protección contra virus y amenazas_ → _Administrar configuración_
2. Agrega exclusión para la carpeta del proyecto
3. O desactiva temporalmente la protección en tiempo real mientras instalas

---

## Resumen de puertos

| Servicio                       | Puerto | URL                   |
| ------------------------------ | ------ | --------------------- |
| Backend (Express)              | 3000   | http://localhost:3000 |
| Frontend (serve / Live Server) | 5500   | http://localhost:5500 |
| PostgreSQL                     | 5432   | localhost:5432        |

## Credenciales de prueba

| Qué                       | Valor                                  |
| ------------------------- | -------------------------------------- |
| Usuario admin del sistema | `admin@stockmanager.com` / `Admin123!` |
| Usuario PostgreSQL        | `postgres` / `postgres`                |
| Base de datos             | `stockmanager`                         |
