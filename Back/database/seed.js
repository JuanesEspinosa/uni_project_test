/**
 * seed.js — Datos iniciales de StockManager
 *
 * Uso: node database/seed.js
 *
 * Crea:
 *   - 1 usuario admin (admin@stockmanager.com / Admin123!)
 *   - 2 clientes de ejemplo
 *   - 3 productos de ejemplo
 */

require("dotenv").config();
const pool = require("../src/config/db");
const bcrypt = require("bcrypt");

async function seed() {
  const client = await pool.connect();

  try {
    console.log("🌱 Iniciando seed...");

    // ── Usuarios ──────────────────────────────────────────────
    const adminEmail = "admin@stockmanager.com";
    const adminPassword = "Admin123!";

    const existingUser = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [adminEmail],
    );

    if (existingUser.rows.length === 0) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await client.query(
        `INSERT INTO users (full_name, email, password, role)
         VALUES ($1, $2, $3, $4)`,
        ["Admin Principal", adminEmail, passwordHash, "admin"],
      );
      console.log(`✓ Usuario admin creado: ${adminEmail} / ${adminPassword}`);
    } else {
      console.log(`  Usuario admin ya existe, omitiendo.`);
    }

    // ── Clientes ──────────────────────────────────────────────
    const clientesExistentes = await client.query(
      "SELECT COUNT(*) AS count FROM clients",
    );
    if (parseInt(clientesExistentes.rows[0].count) === 0) {
      await client.query(
        `INSERT INTO clients (full_name, email, phone) VALUES
         ('Cliente Demo',  'cliente@demo.com',  '3001234567'),
         ('Juan García',   'juan@test.com',     '3009876543'),
         ('María López',   'maria@test.com',    '3115554433')`,
      );
      console.log("✓ Clientes de ejemplo creados.");
    } else {
      console.log("  Clientes ya existen, omitiendo.");
    }

    // ── Productos ─────────────────────────────────────────────
    const productosExistentes = await client.query(
      "SELECT COUNT(*) AS count FROM products",
    );
    if (parseInt(productosExistentes.rows[0].count) === 0) {
      await client.query(
        `INSERT INTO products (name, description, price, stock, category) VALUES
         ('Perfume Rosas',     'Fragancia floral 50ml',      85000, 50, 'Perfumes'),
         ('Perfume Lavanda',   'Fragancia suave 30ml',       65000, 30, 'Perfumes'),
         ('Loción Corporal',   'Hidratante natural 200ml',   35000, 100,'Lociones'),
         ('Agua de Colonia',   'Ligera y refrescante 100ml', 45000, 20, 'Perfumes'),
         ('Crema de Manos',    'Nutritiva con aloe vera',    25000, 80, 'Lociones')`,
      );
      console.log("✓ Productos de ejemplo creados.");
    } else {
      console.log("  Productos ya existen, omitiendo.");
    }

    console.log("\n✅ Seed completado.");
    console.log("   Credenciales de prueba:");
    console.log("   Email:    admin@stockmanager.com");
    console.log("   Password: Admin123!\n");
  } catch (error) {
    console.error("❌ Error en seed:", error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
