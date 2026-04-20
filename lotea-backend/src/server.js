const express = require("express");
const cors = require("cors");
const pool = require("./db/connection");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// Servir archivos estáticos (uploads)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Rutas
const lotesRoutes = require("./routes/lotes.routes");
const authRoutes = require("./routes/auth.routes");
const categoriasRoutes = require("./routes/categorias.routes");
const pedidosRoutes = require("./routes/pedidos.routes");

// Endpoints básicos
app.get("/", (req, res) => {
  res.send("API LOTEA funcionando");
});

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rutas principales
app.use("/lotes", lotesRoutes);
app.use("/auth", authRoutes);
app.use("/categorias", categoriasRoutes);
app.use("/pedidos", pedidosRoutes);

// Puerto al final
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
