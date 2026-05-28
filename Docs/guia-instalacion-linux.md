# Guía de Instalación — Linux (Debian / Ubuntu)

## StockManager — Práctica de Pruebas Universitaria

**Sistema operativo:** Debian 12 / Ubuntu 22.04 o superior  
**Fecha:** 2026-05-28

---

## Índice

1. [Instalar dependencias del sistema](#1-instalar-dependencias-del-sistema)
2. [Instalar Node.js](#2-instalar-nodejs)
3. [Instalar y configurar PostgreSQL](#3-instalar-y-configurar-postgresql)
4. [Obtener el proyecto](#4-obtener-el-proyecto)
5. [Configurar el Backend](#5-configurar-el-backend)
6. [Levantar el Frontend](#6-levantar-el-frontend)
7. [Instalar y correr los tests de Playwright](#7-instalar-y-correr-los-tests-de-playwright)
8. [Verificar que todo funciona](#8-verificar-que-todo-funciona)
9. [Comandos de referencia rápida](#9-comandos-de-referencia-rápida)
10. [Solución de problemas comunes](#10-solución-de-problemas-comunes)

---

## 1. Instalar dependencias del sistema

Abre una terminal y ejecuta:

```bash
sudo apt update && sudo apt upgrade -y

# Herramientas básicas
sudo apt install -y curl git wget build-essential
```

Verificar que Git quedó instalado:

```bash
git --version
# Debe mostrar: git version 2.x.x
```

---

## 2. Instalar Node.js

Usamos Node.js 20 (versión LTS). La forma recomendada es a través de **NodeSource**:

```bash
# Descargar e instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar la instalación
node --version    # Debe mostrar: v20.x.x
npm --version     # Debe mostrar: 10.x.x
```

---

## 3. Instalar y configurar PostgreSQL

### 3.1 Instalar PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib

# Iniciar el servicio
sudo systemctl start postgresql
sudo systemctl enable postgresql   # Para que inicie automáticamente al encender

# Verificar que está corriendo
sudo systemctl status postgresql
# Debe mostrar: Active: active (running)
```

### 3.2 Crear usuario y base de datos

PostgreSQL crea un usuario del sistema llamado `postgres`. Accedemos a él:

```bash
sudo -u postgres psql
```

Dentro de la consola de PostgreSQL, ejecuta estos comandos **uno por uno**:

```sql
-- Crear contraseña para el usuario postgres
ALTER USER postgres PASSWORD 'postgres';

-- Crear la base de datos del proyecto
CREATE DATABASE stockmanager;

-- Verificar que se creó
\l

-- Salir
\q
```

### 3.3 Verificar la conexión

```bash
psql -U postgres -h localhost -d stockmanager
# Te pedirá la contraseña: postgres
# Si entra sin error, escribe \q para salir
```

> **Nota:** Si aparece el error `Peer authentication failed`, edita el archivo de configuración:
>
> ```bash
> sudo nano /etc/postgresql/*/main/pg_hba.conf
> ```
>
> Busca la línea que dice `local all postgres peer` y cámbiala a:
>
> ```
> local   all             postgres                                md5
> ```
>
> Luego reinicia PostgreSQL:
>
> ```bash
> sudo systemctl restart postgresql
> ```

---

## 4. Obtener el proyecto

### Opción A — Si lo tienes en un repositorio Git

```bash
git clone https://github.com/tu-usuario/stockmanager.git
cd stockmanager
```

### Opción B — Si lo copias desde otra máquina (USB / zip)

```bash
# Descomprimir si viene en zip
unzip stockmanager.zip -d stockmanager
cd stockmanager
```

Estructura que debes ver:

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

## 5. Configurar el Backend

### 5.1 Instalar dependencias

```bash
cd Back
npm install
```

### 5.2 Crear el archivo de variables de entorno

```bash
cp .env.example .env
nano .env
```

Edita el archivo con los valores correctos:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=stockmanager
JWT_SECRET=stockmanager_secret_2026
PORT=3000
```

Guardar en nano: `Ctrl + O` → `Enter` → `Ctrl + X`

### 5.3 Crear las tablas en la base de datos

```bash
psql -U postgres -h localhost -d stockmanager -f database/schema.sql
# Ingresa la contraseña: postgres
```

Debes ver una salida como:

```
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
```

### 5.4 Poblar con datos de prueba (seed)

```bash
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

### 5.5 Levantar el servidor backend

```bash
# En la carpeta Back/
npm run dev
```

Debes ver:

```
✓ Conexión a PostgreSQL establecida
✓ StockManager API corriendo en http://localhost:3000
  Endpoints disponibles:
    POST http://localhost:3000/api/auth/login
    POST http://localhost:3000/api/auth/register
    GET  http://localhost:3000/api/products
    GET  http://localhost:3000/api/sales
    GET  http://localhost:3000/api/clients
```

> **Deja esta terminal abierta.** El backend debe estar corriendo mientras usas el sistema y corres los tests.

---

## 6. Levantar el Frontend

En Linux no tenemos el Live Server de VS Code de forma nativa en la terminal. Usamos `npx serve`, que viene con Node.js:

### Opción A — Con `serve` (recomendada)

Abre una **nueva terminal** (sin cerrar la del backend):

```bash
# Ir a la carpeta del frontend
cd uni_project_test/Front

# Levantar servidor en el puerto 5500
npx serve -l 5500 .
```

Salida esperada:

```
   ┌─────────────────────────────────────────┐
   │                                         │
   │   Serving!                              │
   │                                         │
   │   Local:    http://localhost:5500       │
   │   Network:  http://192.168.x.x:5500    │
   │                                         │
   └─────────────────────────────────────────┘
```

Abre el navegador en: **http://localhost:5500/login.html**

### Opción B — Con Python (si no quieres usar npx serve)

```bash
cd uni_project_test/Front
python3 -m http.server 5500
```

> **Nota:** Con Python el servidor también funciona en `http://localhost:5500/login.html`

---

## 7. Instalar y correr los tests de Playwright

### 7.1 Instalar dependencias de Playwright

Abre una **tercera terminal** en la carpeta raíz del proyecto:

```bash
cd uni_project_test
npm install
```

### 7.2 Instalar el navegador Chromium para Playwright

```bash
npx playwright install chromium

# En Debian/Ubuntu también se necesitan dependencias del sistema:
npx playwright install-deps chromium
```

Si el comando anterior pide sudo:

```bash
sudo npx playwright install-deps chromium
```

### 7.3 Correr todos los tests

Asegúrate de que el backend (puerto 3000) y el frontend (puerto 5500) estén corriendo antes de ejecutar:

```bash
# Desde uni_project_test/
npm run test:headed
```

Verás el navegador abrirse automáticamente y ejecutar los 20 casos de prueba.

### 7.4 Correr un módulo específico

```bash
npm run test:login      # Solo los 5 casos de login
npm run test:register   # Solo los 5 casos de registro
npm run test:products   # Solo los 5 casos de productos
npm run test:sales      # Solo los 5 casos de ventas
```

### 7.5 Ver el reporte HTML

Cuando terminen los tests, abre el reporte:

```bash
npm run report
```

O directamente en el navegador:

```bash
xdg-open evidencias/reporte-html/index.html
```

---

## 8. Verificar que todo funciona

### Checklist antes de correr los tests

| Paso                    | Cómo verificar                                                                                                        |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------- |
| PostgreSQL corriendo    | `sudo systemctl status postgresql` → debe decir `active (running)`                                                    |
| Backend en puerto 3000  | `curl http://localhost:3000` → debe devolver `{"status":"ok","message":"StockManager API corriendo"}`                 |
| Frontend en puerto 5500 | Abrir `http://localhost:5500/login.html` en el browser                                                                |
| Base de datos con datos | `psql -U postgres -h localhost -d stockmanager -c "SELECT email FROM users;"` → debe mostrar `admin@stockmanager.com` |

### Verificar el backend rápidamente con curl

```bash
# Verificar que el servidor responde
curl http://localhost:3000
# Respuesta esperada: {"status":"ok","message":"StockManager API corriendo"}

# Probar el login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@stockmanager.com","password":"Admin123!"}'
# Respuesta esperada: {"token":"eyJ...","user":{...}}
```

---

## 9. Comandos de referencia rápida

### Iniciar todo el proyecto

```bash
# Terminal 1 — Backend
cd uni_project_test/Back && npm run dev

# Terminal 2 — Frontend
cd uni_project_test/Front && npx serve -l 5500 .

# Terminal 3 — Tests (cuando los dos anteriores están listos)
cd uni_project_test && npm run test:headed
```

### PostgreSQL

```bash
# Iniciar / detener / reiniciar
sudo systemctl start postgresql
sudo systemctl stop postgresql
sudo systemctl restart postgresql

# Conectarse a la base de datos
psql -U postgres -h localhost -d stockmanager

# Ver las tablas
\dt

# Ver datos de usuarios
SELECT id, email, role FROM users;

# Salir
\q
```

### Recrear la base de datos desde cero

```bash
# Conectarse como postgres
sudo -u postgres psql

# Eliminar y recrear
DROP DATABASE IF EXISTS stockmanager;
CREATE DATABASE stockmanager;
\q

# Volver a crear tablas y seed
cd uni_project_test/Back
psql -U postgres -h localhost -d stockmanager -f database/schema.sql
node database/seed.js
```

---

## 10. Solución de problemas comunes

### ❌ `ECONNREFUSED` al correr el backend

**Causa:** PostgreSQL no está corriendo o las credenciales del `.env` son incorrectas.

```bash
# Verificar PostgreSQL
sudo systemctl status postgresql

# Verificar conexión
psql -U postgres -h localhost -d stockmanager
```

---

### ❌ `role "postgres" does not exist`

**Causa:** El usuario `postgres` no tiene contraseña configurada.

```bash
sudo -u postgres psql
ALTER USER postgres PASSWORD 'postgres';
\q
```

---

### ❌ `Error: listen EADDRINUSE :::3000`

**Causa:** El puerto 3000 ya está en uso (otra instancia del backend corriendo).

```bash
# Ver qué proceso usa el puerto 3000
sudo lsof -i :3000

# Matar el proceso (reemplaza PID con el número que aparece)
kill -9 <PID>
```

---

### ❌ Playwright: `browserType.launch: Executable doesn't exist`

**Causa:** No se instaló Chromium.

```bash
npx playwright install chromium
sudo npx playwright install-deps chromium
```

---

### ❌ Playwright: `Error: connect ECONNREFUSED 127.0.0.1:5500`

**Causa:** El frontend no está corriendo en el puerto 5500.

```bash
# Verificar
curl http://localhost:5500
# Si no responde, levantarlo:
cd uni_project_test/Front && npx serve -l 5500 .
```

---

### ❌ `psql: error: connection to server on socket failed`

**Causa:** PostgreSQL usa socket Unix por defecto en Debian. Agrega `-h localhost` para forzar TCP:

```bash
psql -U postgres -h localhost -d stockmanager
```

---

## Resumen de puertos

| Servicio          | Puerto | URL                   |
| ----------------- | ------ | --------------------- |
| Backend (Express) | 3000   | http://localhost:3000 |
| Frontend (serve)  | 5500   | http://localhost:5500 |
| PostgreSQL        | 5432   | localhost:5432        |

## Credenciales de prueba

| Qué                       | Valor                                  |
| ------------------------- | -------------------------------------- |
| Usuario admin del sistema | `admin@stockmanager.com` / `Admin123!` |
| Usuario PostgreSQL        | `postgres` / `postgres`                |
| Base de datos             | `stockmanager`                         |
