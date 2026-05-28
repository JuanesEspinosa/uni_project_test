require("dotenv").config();
const app = require("./src/app");
const pool = require("./src/config/db");

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // Verificar conexión a PostgreSQL antes de arrancar
    await pool.query("SELECT 1");
    console.log("✓ Conexión a PostgreSQL establecida");

    app.listen(PORT, () => {
      console.log(`✓ StockManager API corriendo en http://localhost:${PORT}`);
      console.log(`  Endpoints disponibles:`);
      console.log(`    POST http://localhost:${PORT}/api/auth/login`);
      console.log(`    POST http://localhost:${PORT}/api/auth/register`);
      console.log(`    GET  http://localhost:${PORT}/api/products`);
      console.log(`    GET  http://localhost:${PORT}/api/sales`);
      console.log(`    GET  http://localhost:${PORT}/api/clients`);
    });
  } catch (error) {
    console.error("❌ No se pudo conectar a PostgreSQL:", error.message);
    console.error(
      "   Verifica que PostgreSQL esté corriendo y que el .env sea correcto.",
    );
    process.exit(1);
  }
}

start();
