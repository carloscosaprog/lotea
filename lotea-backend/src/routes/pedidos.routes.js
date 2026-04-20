const express = require("express");
const router = express.Router();
const pool = require("../db/connection");
const authMiddleware = require("../middleware/auth");

// Crear pedido
router.post("/", authMiddleware, async (req, res) => {
  const { id_lote, cantidad } = req.body;
  const id_usuario = req.user.id;

  try {
    const loteResult = await pool.query(
      "SELECT * FROM Lote WHERE id_lote = $1",
      [id_lote],
    );

    if (loteResult.rows.length === 0) {
      return res.status(404).json({ message: "Lote no encontrado" });
    }

    const lote = loteResult.rows[0];

    if (lote.cantidad < cantidad) {
      return res.status(400).json({ message: "Stock insuficiente" });
    }

    const pedidoResult = await pool.query(
      "INSERT INTO Pedido (id_usuario) VALUES ($1) RETURNING *",
      [id_usuario],
    );

    const pedido = pedidoResult.rows[0];

    await pool.query(
      `INSERT INTO Detalle_Pedido 
      (id_pedido, id_lote, cantidad, precio_unitario) 
      VALUES ($1, $2, $3, $4)`,
      [pedido.id_pedido, id_lote, cantidad, lote.precio],
    );

    await pool.query(
      "UPDATE Lote SET cantidad = cantidad - $1 WHERE id_lote = $2",
      [cantidad, id_lote],
    );

    res.json({ message: "Pedido creado correctamente", pedido });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear pedido" });
  }
});

// Obtener pedidos del usuario
router.get("/", authMiddleware, async (req, res) => {
  const id_usuario = req.user.id;

  try {
    const result = await pool.query(
      `SELECT p.*, d.id_lote, d.cantidad, d.precio_unitario, l.titulo
       FROM Pedido p
       JOIN Detalle_Pedido d ON p.id_pedido = d.id_pedido
       JOIN Lote l ON d.id_lote = l.id_lote
       WHERE p.id_usuario = $1
       ORDER BY p.fecha DESC`,
      [id_usuario],
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener pedidos" });
  }
});

module.exports = router;
