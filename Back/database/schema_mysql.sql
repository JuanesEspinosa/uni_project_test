-- ============================================================
-- StockManager — Schema de base de datos para MySQL
-- ============================================================

-- Usuarios del sistema
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  full_name  VARCHAR(100) NOT NULL,
  email      VARCHAR(150) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  role       VARCHAR(20)  NOT NULL DEFAULT 'seller' CHECK (role IN ('admin', 'seller')),
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Catálogo de productos
CREATE TABLE IF NOT EXISTS products (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  price       DECIMAL(12,2) NOT NULL CHECK (price >= 0),
  stock       INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category    VARCHAR(50),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Clientes
CREATE TABLE IF NOT EXISTS clients (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  full_name  VARCHAR(100) NOT NULL,
  email      VARCHAR(150),
  phone      VARCHAR(20),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Cabecera de ventas
CREATE TABLE IF NOT EXISTS sales (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  client_id  INT,
  user_id    INT,
  total      DECIMAL(14,2) NOT NULL DEFAULT 0,
  notes      TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Items de cada venta
CREATE TABLE IF NOT EXISTS sale_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  sale_id    INT NOT NULL,
  product_id INT NOT NULL,
  quantity   INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0),
  subtotal   DECIMAL(14,2) NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);
