const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const productsRoutes = require("./routes/products.routes");
const salesRoutes = require("./routes/sales.routes");
const clientsRoutes = require("./routes/clients.routes");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/clients", clientsRoutes);

// Ruta raíz — verificar que el servidor está vivo
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "StockManager API corriendo" });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res
    .status(404)
    .json({ error: `Ruta no encontrada: ${req.method} ${req.path}` });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error("Error no controlado:", err.message);
  res.status(500).json({ error: "Error interno del servidor" });
});

module.exports = app;
