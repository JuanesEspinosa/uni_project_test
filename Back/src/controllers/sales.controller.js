const pool = require("../config/db");

// GET /api/sales
async function getAll(req, res) {
  try {
    const result = await pool.query(
      `SELECT s.id, s.total, s.notes, s.created_at,
              c.full_name AS client_name,
              u.full_name AS user_name
       FROM sales s
       LEFT JOIN clients c ON c.id = s.client_id
       LEFT JOIN users   u ON u.id = s.user_id
       ORDER BY s.created_at DESC`,
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al listar ventas:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// GET /api/sales/:id
async function getOne(req, res) {
  const { id } = req.params;

  try {
    const saleResult = await pool.query(
      `SELECT s.id, s.total, s.notes, s.created_at,
              c.full_name AS client_name,
              u.full_name AS user_name
       FROM sales s
       LEFT JOIN clients c ON c.id = s.client_id
       LEFT JOIN users   u ON u.id = s.user_id
       WHERE s.id = $1`,
      [id],
    );

    if (saleResult.rows.length === 0) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    const itemsResult = await pool.query(
      `SELECT si.id, si.quantity, si.unit_price, si.subtotal,
              p.name AS product_name
       FROM sale_items si
       JOIN products p ON p.id = si.product_id
       WHERE si.sale_id = $1`,
      [id],
    );

    res.json({
      ...saleResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (error) {
    console.error("Error al obtener venta:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// POST /api/sales
// Body: { clientId, notes, items: [{ productId, quantity }] }
async function create(req, res) {
  const { clientId, notes, items } = req.body;

  if (!clientId) {
    return res.status(400).json({ error: "El cliente es requerido" });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .json({ error: "La venta debe tener al menos un producto" });
  }

  for (const item of items) {
    if (!item.productId || !item.quantity || Number(item.quantity) <= 0) {
      return res
        .status(400)
        .json({ error: "Cada item debe tener producto y cantidad mayor a 0" });
    }
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let total = 0;
    const resolvedItems = [];

    // Verificar stock y calcular precios dentro de la transacción
    for (const item of items) {
      const productResult = await client.query(
        `SELECT id, name, price, stock FROM products WHERE id = $1 AND is_active = TRUE`,
        [item.productId],
      );

      if (productResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res
          .status(404)
          .json({ error: `Producto ${item.productId} no encontrado` });
      }

      const product = productResult.rows[0];
      const quantity = Number(item.quantity);

      if (product.stock < quantity) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: `Stock insuficiente para "${product.name}". Disponible: ${product.stock}, solicitado: ${quantity}`,
        });
      }

      const subtotal = Number(product.price) * quantity;
      total += subtotal;

      resolvedItems.push({
        productId: product.id,
        quantity,
        unitPrice: Number(product.price),
        subtotal,
      });
    }

    // Crear la cabecera de la venta
    let saleId;
    if (pool.isMySQL) {
      const saleResult = await client.query(
        `INSERT INTO sales (client_id, user_id, total, notes)
         VALUES ($1, $2, $3, $4)`,
        [clientId, req.user.id, total, notes || null],
      );
      saleId = saleResult.insertId;
    } else {
      const saleResult = await client.query(
        `INSERT INTO sales (client_id, user_id, total, notes)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [clientId, req.user.id, total, notes || null],
      );
      saleId = saleResult.rows[0].id;
    }

    // Insertar items y descontar stock
    for (const item of resolvedItems) {
      await client.query(
        `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [saleId, item.productId, item.quantity, item.unitPrice, item.subtotal],
      );

      await client.query(
        `UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2`,
        [item.quantity, item.productId],
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Venta registrada exitosamente",
      saleId,
      total,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al crear venta:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    client.release();
  }
}

module.exports = { getAll, getOne, create };
