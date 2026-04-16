const express = require("express");
const router = express.Router();
const pool = require("../db/connection");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const authMiddleware = require("../middleware/auth");

const SECRET = "secreto_super_seguro";

// ======================
// REGISTER
// ======================
router.post("/register", async (req, res) => {
  try {
    const { nombre, email, contrasena } = req.body;

    const userExists = await pool.query(
      "SELECT * FROM Usuario WHERE email = $1",
      [email],
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: "El usuario ya existe" });
    }

    const hashedPassword = await bcrypt.hash(contrasena, 10);

    const result = await pool.query(
      `INSERT INTO Usuario (nombre, email, contrasena)
       VALUES ($1, $2, $3)
       RETURNING id_usuario, nombre, email`,
      [nombre, email, hashedPassword],
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("ERROR REGISTER:", error);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
});

// ======================
// LOGIN
// ======================
router.post("/login", async (req, res) => {
  try {
    const { email, contrasena } = req.body;

    const result = await pool.query(
      `SELECT * FROM Usuario WHERE email = $1 OR nombre = $1`,
      [email],
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        error: "El usuario no existe",
      });
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(contrasena, user.contrasena);

    if (!validPassword) {
      return res.status(400).json({
        error: "Contraseña incorrecta",
      });
    }

    const token = jwt.sign(
      {
        id: user.id_usuario,
        email: user.email,
      },
      SECRET,
      { expiresIn: "2h" },
    );

    res.json({
      token,
      user: {
        id: user.id_usuario,
        nombre: user.nombre,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("ERROR LOGIN:", error);
    res.status(500).json({ error: "Error en login" });
  }
});

// ======================
// GET PERFIL
// ======================
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id_usuario, nombre, email, avatar FROM Usuario WHERE id_usuario = $1",
      [req.user.id],
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("ERROR PERFIL:", error);
    res.status(500).json({ error: "Error al obtener perfil" });
  }
});

// ======================
// UPDATE PERFIL
// ======================
router.put("/me", authMiddleware, async (req, res) => {
  try {
    const { nombre } = req.body;

    const result = await pool.query(
      `UPDATE Usuario 
       SET nombre = $1
       WHERE id_usuario = $2
       RETURNING id_usuario, nombre, email, avatar`,
      [nombre, req.user.id],
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("ERROR UPDATE PERFIL:", error);
    res.status(500).json({ error: "Error al actualizar perfil" });
  }
});

module.exports = router;
