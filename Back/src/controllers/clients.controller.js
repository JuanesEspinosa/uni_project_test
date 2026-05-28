const pool = require("../config/db");

// GET /api/clients
async function getAll(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, phone, created_at
       FROM clients
       ORDER BY full_name ASC`,
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al listar clientes:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// POST /api/clients
async function create(req, res) {
  const { fullName, email, phone } = req.body;

  if (!fullName || fullName.trim() === "") {
    return res
      .status(400)
      .json({ error: "El nombre del cliente es requerido" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO clients (full_name, email, phone)
       VALUES ($1, $2, $3)
       RETURNING id, full_name, email, phone, created_at`,
      [fullName.trim(), email || null, phone || null],
    );

    res.status(201).json({
      message: "Cliente creado exitosamente",
      client: result.rows[0],
    });
  } catch (error) {
    console.error("Error al crear cliente:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

module.exports = { getAll, create };
