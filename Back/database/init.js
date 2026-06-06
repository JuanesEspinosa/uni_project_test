/**
 * init.js — Crea la base de datos y aplica el schema
 *
 * Uso: node database/init.js
 */

require("dotenv").config();
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

async function init() {
  // Conectar a postgres (sin especificar la BD) para crearla
  const adminPool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "postgres",
  });

  try {
    console.log(`Creando base de datos "${process.env.DB_NAME}"...`);
    await adminPool.query(`CREATE DATABASE ${process.env.DB_NAME}`);
    console.log(`✓ Base de datos creada.`);
  } catch (err) {
    if (err.code === "42P04") {
      console.log(`  La base de datos ya existe, continuando.`);
    } else {
      console.error("❌ Error al crear la base de datos:", err.message);
      process.exit(1);
    }
  } finally {
    await adminPool.end();
  }

  // Conectar a la BD recién creada y ejecutar el schema
  const dbPool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
    console.log("Aplicando schema...");
    await dbPool.query(schema);
    console.log("✓ Tablas creadas.");
  } catch (err) {
    console.error("❌ Error al aplicar schema:", err.message);
    process.exit(1);
  } finally {
    await dbPool.end();
  }
}

init();
