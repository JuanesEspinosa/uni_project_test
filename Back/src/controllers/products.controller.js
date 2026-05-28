const pool = require("../config/db");

// GET /api/products
async function getAll(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, name, description, price, stock, category, is_active, created_at
       FROM products
       WHERE is_active = TRUE
       ORDER BY stock DESC, name ASC`,
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al listar productos:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// POST /api/products
async function create(req, res) {
  const { name, description, price, stock, category } = req.body;

  if (!name || name.trim() === "") {
    return res
      .status(400)
      .json({ error: "El nombre del producto es requerido" });
  }

  if (name.trim().length > 100) {
    return res
      .status(400)
      .json({ error: "El nombre no puede superar 100 caracteres" });
  }

  if (price === undefined || price === null || price === "") {
    return res.status(400).json({ error: "El precio es requerido" });
  }

  if (Number(price) < 0) {
    return res.status(400).json({ error: "El precio no puede ser negativo" });
  }

  const stockValue = stock !== undefined ? Number(stock) : 0;
  if (stockValue < 0) {
    return res.status(400).json({ error: "El stock no puede ser negativo" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO products (name, description, price, stock, category)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, description, price, stock, category, created_at`,
      [
        name.trim(),
        description || null,
        Number(price),
        stockValue,
        category || null,
      ],
    );

    res.status(201).json({
      message: "Producto creado exitosamente",
      product: result.rows[0],
    });
  } catch (error) {
    console.error("Error al crear producto:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// PUT /api/products/:id
async function update(req, res) {
  const { id } = req.params;
  const { name, description, price, stock, category } = req.body;

  if (!name || name.trim() === "") {
    return res
      .status(400)
      .json({ error: "El nombre del producto es requerido" });
  }

  if (Number(price) < 0) {
    return res.status(400).json({ error: "El precio no puede ser negativo" });
  }

  if (Number(stock) < 0) {
    return res.status(400).json({ error: "El stock no puede ser negativo" });
  }

  try {
    const result = await pool.query(
      `UPDATE products
       SET name = $1, description = $2, price = $3, stock = $4, category = $5, updated_at = NOW()
       WHERE id = $6 AND is_active = TRUE
       RETURNING id, name, description, price, stock, category, updated_at`,
      [
        name.trim(),
        description || null,
        Number(price),
        Number(stock),
        category || null,
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({ message: "Producto actualizado", product: result.rows[0] });
  } catch (error) {
    console.error("Error al actualizar producto:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// DELETE /api/products/:id  (soft delete)
async function remove(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE products SET is_active = FALSE, updated_at = NOW()
       WHERE id = $1 AND is_active = TRUE
       RETURNING id`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({ message: "Producto eliminado" });
  } catch (error) {
    console.error("Error al eliminar producto:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

module.exports = { getAll, create, update, remove };
