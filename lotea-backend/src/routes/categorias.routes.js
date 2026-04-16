const express = require("express");
const router = express.Router();
const pool = require("../db/connection");

// Obtener todas las categorías
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM Categoria ORDER BY nombre ASC",
    );

    res.json(result.rows);
  } catch (error) {
    console.error("ERROR GET CATEGORIAS:", error);
    res.status(500).json({ error: "Error al obtener categorías" });
  }
});

module.exports = router;
