const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña son requeridos" });
  }

  try {
    const result = await pool.query(
      "SELECT id, full_name, email, password, role FROM users WHERE email = $1 AND is_active = TRUE",
      [email],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );

    res.json({
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error en login:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

// POST /api/auth/register
async function register(req, res) {
  const { fullName, email, password, role } = req.body;

  if (!fullName || !email || !password) {
    return res
      .status(400)
      .json({ error: "Nombre, email y contraseña son requeridos" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "La contraseña debe tener al menos 6 caracteres" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Formato de email inválido" });
  }

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "El email ya está registrado" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const assignedRole = role === "seller" ? "seller" : "admin";

    let newUser;
    if (pool.isMySQL) {
      const result = await pool.query(
        `INSERT INTO users (full_name, email, password, role)
         VALUES ($1, $2, $3, $4)`,
        [fullName, email, passwordHash, assignedRole],
      );
      const selectResult = await pool.query(
        `SELECT id, full_name, email, role, created_at FROM users WHERE id = $1`,
        [result.insertId],
      );
      newUser = selectResult.rows[0];
    } else {
      const result = await pool.query(
        `INSERT INTO users (full_name, email, password, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, full_name, email, role, created_at`,
        [fullName, email, passwordHash, assignedRole],
      );
      newUser = result.rows[0];
    }

    res.status(201).json({
      message: "Usuario registrado exitosamente",
      user: {
        id: newUser.id,
        fullName: newUser.full_name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.created_at,
      },
    });
  } catch (error) {
    console.error("Error en register:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

module.exports = { login, register };
