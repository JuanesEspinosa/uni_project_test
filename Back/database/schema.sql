-- ============================================================
-- StockManager — Schema de base de datos
-- Ejecutar: psql -U postgres -d stockmanager -f database/schema.sql
-- ============================================================

-- Usuarios del sistema
CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  full_name  VARCHAR(100) NOT NULL,
  email      VARCHAR(150) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  role       VARCHAR(20)  NOT NULL DEFAULT 'seller' CHECK (role IN ('admin', 'seller')),
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Catálogo de productos
CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  price       NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category    VARCHAR(50),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Clientes
CREATE TABLE IF NOT EXISTS clients (
  id         SERIAL PRIMARY KEY,
  full_name  VARCHAR(100) NOT NULL,
  email      VARCHAR(150),
  phone      VARCHAR(20),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Cabecera de ventas
CREATE TABLE IF NOT EXISTS sales (
  id         SERIAL PRIMARY KEY,
  client_id  INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  user_id    INTEGER REFERENCES users(id)   ON DELETE SET NULL,
  total      NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes      TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Items de cada venta
CREATE TABLE IF NOT EXISTS sale_items (
  id         SERIAL PRIMARY KEY,
  sale_id    INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity   INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  subtotal   NUMERIC(14,2) NOT NULL
);
