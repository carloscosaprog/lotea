const express = require("express");
const router = express.Router();
const pool = require("../db/connection");

const multer = require("multer");
const path = require("path");

const authMiddleware = require("../middleware/auth");

const BASE_URL = "http://192.168.0.65:3000";

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

/* ======================
   GET LOTES DE USUARIO
====================== */

router.get("/usuario/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT 
        l.id_lote,
        l.titulo,
        l.descripcion,
        l.precio,
        l.cantidad,
        l.id_vendedor,
        i.url AS imagen
      FROM Lote l
      LEFT JOIN Imagen_Lote i 
        ON l.id_lote = i.id_lote AND i.es_principal = true
      WHERE l.id_vendedor = $1
      ORDER BY l.fecha_publicacion DESC
      `,
      [id],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("ERROR GET LOTES USUARIO:", error);
    res.status(500).json({ error: error.message });
  }
});

/* ======================
   GET USUARIO POR ID
====================== */

router.get("/user/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT 
        id_usuario,
        nombre,
        email,
        avatar
      FROM Usuario
      WHERE id_usuario = $1
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("ERROR GET USER:", error);
    res.status(500).json({ error: error.message });
  }
});

/* ======================
   GET TODOS
====================== */

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        l.id_lote,
        l.titulo,
        l.descripcion,
        l.precio,
        l.cantidad,
        l.id_vendedor,
        u.nombre AS vendedor,
        c.nombre AS categoria,
        i.url AS imagen
      FROM Lote l
      JOIN Usuario u ON l.id_vendedor = u.id_usuario
      LEFT JOIN Categoria c ON l.id_categoria = c.id_categoria
      LEFT JOIN Imagen_Lote i 
        ON l.id_lote = i.id_lote AND i.es_principal = true
      ORDER BY l.fecha_publicacion DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("ERROR GET LOTES:", error);
    res.status(500).json({ error: error.message });
  }
});

/* ======================
   GET POR ID
====================== */

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const lote = await pool.query(
      `
      SELECT 
        l.*,
        u.nombre AS vendedor,
        c.nombre AS categoria
      FROM Lote l
      JOIN Usuario u ON l.id_vendedor = u.id_usuario
      LEFT JOIN Categoria c ON l.id_categoria = c.id_categoria
      WHERE l.id_lote = $1
      `,
      [id],
    );

    if (lote.rows.length === 0) {
      return res.status(404).json({ error: "Lote no encontrado" });
    }

    const imagenes = await pool.query(
      "SELECT url FROM Imagen_Lote WHERE id_lote = $1",
      [id],
    );

    res.json({
      ...lote.rows[0],
      imagenes: imagenes.rows,
    });
  } catch (error) {
    console.error("ERROR GET LOTE:", error);
    res.status(500).json({ error: error.message });
  }
});

/* ======================
   POST
====================== */

router.post(
  "/",
  authMiddleware,
  upload.array("imagenesFiles"),
  async (req, res) => {
    try {
      const { titulo, descripcion, precio, cantidad, id_categoria } = req.body;

      const lote = await pool.query(
        `INSERT INTO Lote 
        (titulo, descripcion, precio, cantidad, id_vendedor, id_categoria)
        VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING *`,
        [titulo, descripcion, precio, cantidad, req.user.id, id_categoria],
      );

      const files = req.files || [];

      for (let i = 0; i < files.length; i++) {
        await pool.query(
          `INSERT INTO Imagen_Lote (id_lote, url, es_principal)
           VALUES ($1,$2,$3)`,
          [
            lote.rows[0].id_lote,
            `${BASE_URL}/uploads/${files[i].filename}`,
            i === 0,
          ],
        );
      }

      res.json(lote.rows[0]);
    } catch (error) {
      console.error("ERROR POST LOTE:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

/* ======================
   PUT
====================== */

router.put(
  "/:id",
  authMiddleware,
  upload.array("imagenesFiles"),
  async (req, res) => {
    try {
      const { id } = req.params;

      await pool.query(
        `UPDATE Lote SET 
         titulo=$1, 
         descripcion=$2, 
         precio=$3, 
         cantidad=$4, 
         id_categoria=$5
         WHERE id_lote=$6`,
        [
          req.body.titulo,
          req.body.descripcion,
          Number(req.body.precio),
          Number(req.body.cantidad),
          Number(req.body.id_categoria),
          id,
        ],
      );

      let imagenesExistentes = [];

      if (req.body.imagenes) {
        try {
          if (Array.isArray(req.body.imagenes)) {
            imagenesExistentes = req.body.imagenes;
          } else if (typeof req.body.imagenes === "string") {
            imagenesExistentes = JSON.parse(req.body.imagenes);
          }
        } catch (error) {
          console.error("Error parseando imagenes:", error);
          imagenesExistentes = [];
        }
      }

      imagenesExistentes = imagenesExistentes.filter(
        (img) => typeof img === "string" && img.trim() !== "",
      );

      const nuevasImagenes = (req.files || []).map(
        (file) => `${BASE_URL}/uploads/${file.filename}`,
      );

      const imagenesFinal = [...imagenesExistentes, ...nuevasImagenes];

      if (imagenesFinal.length === 0) {
        return res.status(400).json({
          error: "Debe haber al menos una imagen",
        });
      }

      await pool.query("DELETE FROM Imagen_Lote WHERE id_lote=$1", [id]);

      for (let i = 0; i < imagenesFinal.length; i++) {
        await pool.query(
          `INSERT INTO Imagen_Lote (id_lote, url, es_principal)
           VALUES ($1,$2,$3)`,
          [id, imagenesFinal[i], i === 0],
        );
      }

      res.json({ message: "Lote actualizado correctamente" });
    } catch (error) {
      console.error("ERROR PUT LOTE:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

/* ======================
   DELETE
====================== */

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await pool.query("DELETE FROM Lote WHERE id_lote=$1", [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    console.error("ERROR DELETE LOTE:", error);
    res.status(500).json({ error: error.message });
  }
});

/* ======================
   SUBIR AVATAR USUARIO
====================== */
router.post(
  "/user/avatar",
  authMiddleware,
  upload.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No se ha subido imagen" });
      }

      const avatarUrl = `${BASE_URL}/uploads/${req.file.filename}`;

      await pool.query("UPDATE Usuario SET avatar = $1 WHERE id_usuario = $2", [
        avatarUrl,
        req.user.id,
      ]);

      res.json({ avatar: avatarUrl });
    } catch (error) {
      console.error("ERROR AVATAR:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

module.exports = router;
