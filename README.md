# StockManager

StockManager es una aplicación web diseñada para el control y administración de inventario (stock) y la gestión de ventas de productos. La aplicación cuenta con una arquitectura desacoplada con un backend API REST y un frontend ligero basado en tecnologías web estándar.

---

## 📂 Estructura del Proyecto

El repositorio está dividido en dos partes principales:

*   **`Back/`**: Servidor API RESTful construido con Node.js, Express y base de datos relacional.
*   **`Front/`**: Cliente de interfaz de usuario liviano y responsivo construido en HTML5, CSS3 y JavaScript vanilla.

---

## 🛠️ Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:
*   [Node.js](https://nodejs.org/) (Versión 16 o superior)
*   **Base de datos:** [PostgreSQL](https://www.postgresql.org/) (puerto por defecto `5432`) **o** [MySQL](https://www.mysql.com/) (puerto por defecto `3306`).

---

## ⚙️ Configuración de la Base de Datos

StockManager cuenta con un **adaptador dinámico** que permite conectarse tanto a PostgreSQL como a MySQL usando el mismo backend.

### Paso 1: Configurar el archivo `.env`
Ve al directorio del backend (`Back/`) y crea o edita tu archivo `.env` basado en `.env.example`:

```env
# Tipo de base de datos a usar: 'postgres' o 'mysql'
DB_TYPE=postgres

# Credenciales de conexión
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_contraseña_aqui
DB_NAME=stockmanager

# Configuración de Servidor y Seguridad
JWT_SECRET=stockmanager_secret_2026
PORT=3000
```

> [!TIP]
> Si deseas cambiar a MySQL, simplemente ajusta `DB_TYPE=mysql`, cambia el puerto a `3306` (o tu puerto MySQL personalizado) y actualiza el usuario y contraseña correspondientes.

### Paso 2: Crear la base de datos
Antes de cargar las tablas, debes crear una base de datos vacía llamada `stockmanager` (o el nombre que definiste en `DB_NAME` en tu `.env`):

*   **Si usas PostgreSQL:**
    Puedes crearla rápidamente desde tu terminal ejecutando:
    ```bash
    createdb -U postgres stockmanager
    ```
    O mediante consola SQL (psql/pgAdmin):
    ```sql
    CREATE DATABASE stockmanager;
    ```

*   **Si usas MySQL:**
    Puedes crearla ejecutando la siguiente consulta SQL en tu consola o cliente de MySQL (como phpMyAdmin o DBeaver):
    ```sql
    CREATE DATABASE stockmanager;
    ```

### Paso 3: Crear el esquema de tablas

*   **Si usas PostgreSQL:**
    Ejecuta el script SQL en tu base de datos:
    ```bash
    psql -U postgres -d stockmanager -f Back/database/schema.sql
    ```
*   **Si usas MySQL:**
    Ejecuta el script SQL en tu base de datos:
    ```bash
    mysql -u tu_usuario -p stockmanager < Back/database/schema_mysql.sql
    ```

---

## 🚀 Iniciando el Backend (API)

1.  Navega al directorio del backend:
    ```bash
    cd Back
    ```
2.  Instala las dependencias necesarias:
    ```bash
    pnpm install
    ```
3.  Siembra los datos de prueba iniciales (Usuario Administrador, Clientes y Productos demo):
    ```bash
    pnpm run setup
    ```
4.  Inicia el servidor en modo de desarrollo:
    ```bash
    pnpm run dev
    ```
    El backend estará disponible en `http://localhost:3000`.

---

## 🎨 Iniciando el Frontend

El frontend está desarrollado con tecnologías nativas del navegador (HTML/CSS/JS) y no requiere ningún proceso de compilación.

Para ejecutarlo:
*   **Opción A (Recomendada):** Servir los archivos del directorio `Front/` usando un servidor de archivos estáticos ligero.
    *   Si utilizas VS Code, puedes usar la extensión **Live Server** haciendo clic derecho sobre [Front/index.html](file:///e:/PC/Documents/Repositorios/uni_project_test/Front/index.html) y seleccionando *Open with Live Server*.
    *   Usando **pnpm**: `pnpm dlx serve Front`
    *   Usando Python: `python -m http.server` dentro de la carpeta `Front/`
*   **Opción B:** Hacer doble clic directamente sobre el archivo [Front/index.html](file:///e:/PC/Documents/Repositorios/uni_project_test/Front/index.html) para abrirlo en tu navegador.

---

## 🔑 Credenciales de Prueba por Defecto

Una vez que hayas ejecutado el script de configuración (`pnpm run setup`), puedes ingresar a la aplicación con las siguientes credenciales:

*   **Email:** `admin@stockmanager.com`
*   **Contraseña:** `Admin123!`

---

## 📡 Endpoints de la API REST

La API expone los siguientes endpoints para el consumo:

| Método | Endpoint | Descripción | Requiere Auth |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/login` | Iniciar sesión y obtener token JWT. | No |
| **POST** | `/api/auth/register` | Registrar un nuevo usuario (admin o seller). | No |
| **GET** | `/api/products` | Listar todos los productos activos en catálogo. | Sí |
| **POST** | `/api/products` | Crear un nuevo producto en inventario. | Sí |
| **PUT** | `/api/products/:id` | Editar información y stock de un producto. | Sí |
| **DELETE**| `/api/products/:id` | Eliminar de forma lógica un producto. | Sí |
| **GET** | `/api/clients` | Obtener listado de clientes registrados. | Sí |
| **POST** | `/api/clients` | Registrar un nuevo cliente. | Sí |
| **GET** | `/api/sales` | Listar el historial de ventas realizadas. | Sí |
| **GET** | `/api/sales/:id` | Obtener detalles y productos de una venta específica. | Sí |
| **POST** | `/api/sales` | Registrar una nueva venta (descuenta stock). | Sí |
