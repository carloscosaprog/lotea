const express = require("express");
const router = express.Router();
const pool = require("../db/connection");

const authMiddleware = require("../middleware/auth");

/* ======================
   TOGGLE FAVORITO
====================== */

router.post("/:id_lote", authMiddleware, async (req, res) => {
  try {
    const { id_lote } = req.params;
    const id_usuario = req.user.id;

    // comprobar si ya existe
    const existing = await pool.query(
      "SELECT * FROM Favorito WHERE id_usuario = $1 AND id_lote = $2",
      [id_usuario, id_lote],
    );

    if (existing.rows.length > 0) {
      // eliminar
      await pool.query(
        "DELETE FROM Favorito WHERE id_usuario = $1 AND id_lote = $2",
        [id_usuario, id_lote],
      );

      return res.json({ favorito: false });
    }

    // crear
    await pool.query(
      "INSERT INTO Favorito (id_usuario, id_lote) VALUES ($1, $2)",
      [id_usuario, id_lote],
    );

    res.json({ favorito: true });
  } catch (error) {
    console.error("ERROR TOGGLE FAVORITO:", error);
    res.status(500).json({ error: error.message });
  }
});

/* ======================
   GET FAVORITOS DEL USUARIO
====================== */

router.get("/", authMiddleware, async (req, res) => {
  try {
    const id_usuario = req.user.id;

    const result = await pool.query(
      `
      SELECT 
        l.id_lote,
        l.titulo,
        l.descripcion,
        l.precio,
        l.cantidad,
        l.id_vendedor,
        i.url AS imagen,
        COUNT(f.id_favorito) AS total_favoritos
      FROM Favorito f
      JOIN Lote l ON f.id_lote = l.id_lote
      LEFT JOIN Imagen_Lote i 
        ON l.id_lote = i.id_lote AND i.es_principal = true
      LEFT JOIN Favorito f2 ON l.id_lote = f2.id_lote
      WHERE f.id_usuario = $1
      GROUP BY l.id_lote, i.url
      ORDER BY l.fecha_publicacion DESC
      `,
      [id_usuario],
    );

    // normalizar como hicimos antes
    const lotes = result.rows.map((lote) => ({
      ...lote,
      imagenes: lote.imagen ? [lote.imagen] : [],
    }));

    res.json(lotes);
  } catch (error) {
    console.error("ERROR GET FAVORITOS:", error);
    res.status(500).json({ error: error.message });
  }
});

/* ======================
   CHECK FAVORITO
====================== */

router.get("/check/:id_lote", authMiddleware, async (req, res) => {
  try {
    const { id_lote } = req.params;
    const id_usuario = req.user.id;

    const result = await pool.query(
      "SELECT 1 FROM Favorito WHERE id_usuario = $1 AND id_lote = $2",
      [id_usuario, id_lote],
    );

    res.json({ favorito: result.rows.length > 0 });
  } catch (error) {
    console.error("ERROR CHECK FAVORITO:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
