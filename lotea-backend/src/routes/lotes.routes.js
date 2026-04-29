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

const normalizeCategorias = (categorias, categoria) => {
  if (Array.isArray(categorias)) return categorias;

  if (typeof categorias === "string" && categorias.trim()) {
    try {
      const parsed = JSON.parse(categorias);
      if (Array.isArray(parsed)) return parsed;
    } catch (error) {
      return [categorias];
    }
  }

  return categoria ? [categoria] : [];
};

const withCategorias = (lote) => ({
  ...lote,
  categorias: normalizeCategorias(lote.categorias, lote.categoria),
});

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
        i.url AS imagen,
        COUNT(f.id_usuario) AS total_favoritos
      FROM Lote l
      LEFT JOIN Imagen_Lote i 
        ON l.id_lote = i.id_lote AND i.es_principal = true
      LEFT JOIN Favorito f 
        ON l.id_lote = f.id_lote
      WHERE l.id_vendedor = $1
      GROUP BY l.id_lote, i.url
      ORDER BY l.fecha_publicacion DESC
      `,
      [id],
    );

    const lotes = result.rows.map((lote) => ({
      ...withCategorias(lote),
      imagenes: lote.imagen ? [lote.imagen] : [],
      total_favoritos: Number(lote.total_favoritos),
    }));

    res.json(lotes);
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
        i.url AS imagen,
        COUNT(f.id_usuario) AS total_favoritos
      FROM Lote l
      JOIN Usuario u ON l.id_vendedor = u.id_usuario
      LEFT JOIN Categoria c ON l.id_categoria = c.id_categoria
      LEFT JOIN Imagen_Lote i 
        ON l.id_lote = i.id_lote AND i.es_principal = true
      LEFT JOIN Favorito f 
        ON l.id_lote = f.id_lote
      GROUP BY l.id_lote, u.nombre, c.nombre, i.url
      ORDER BY l.fecha_publicacion DESC
    `);

    const lotes = result.rows.map((lote) => ({
      ...withCategorias(lote),
      imagenes: lote.imagen ? [lote.imagen] : [],
      total_favoritos: Number(lote.total_favoritos),
    }));

    res.json(lotes);
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

    const imagenesQuery = await pool.query(
      "SELECT url FROM Imagen_Lote WHERE id_lote = $1",
      [id],
    );

    const imagenes = imagenesQuery.rows.map((img) => img.url);

    const favResult = await pool.query(
      "SELECT COUNT(*) FROM Favorito WHERE id_lote = $1",
      [id],
    );

    res.json({
      ...withCategorias(lote.rows[0]),
      imagenes,
      imagen: imagenes[0] || null,
      total_favoritos: Number(favResult.rows[0].count),
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
      const {
        titulo,
        descripcion,
        precio,
        cantidad,
        id_categoria,
        categoria,
        categorias,
      } = req.body;
      const categoriasNormalizadas = normalizeCategorias(categorias, categoria);

      const lote = await pool.query(
        `INSERT INTO Lote 
        (titulo, descripcion, precio, cantidad, id_vendedor, id_categoria)
        VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING *`,
        [titulo, descripcion, precio, cantidad, req.user.id, id_categoria],
      );

      const files = req.files || [];

      let imagenes = [];

      for (let i = 0; i < files.length; i++) {
        const url = `${BASE_URL}/uploads/${files[i].filename}`;

        imagenes.push(url);

        await pool.query(
          `INSERT INTO Imagen_Lote (id_lote, url, es_principal)
           VALUES ($1,$2,$3)`,
          [lote.rows[0].id_lote, url, i === 0],
        );
      }

      res.json({
        ...lote.rows[0],
        categorias: categoriasNormalizadas,
        imagenes,
        imagen: imagenes[0] || null,
      });
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
      const {
        titulo,
        descripcion,
        precio,
        cantidad,
        id_categoria,
        categoria,
        categorias,
        imagenes,
      } = req.body;
      const categoriasNormalizadas =
        categorias !== undefined
          ? normalizeCategorias(categorias)
          : normalizeCategorias(undefined, categoria);

      const lote = await pool.query(
        `UPDATE Lote
         SET titulo = $1,
             descripcion = $2,
             precio = $3,
             cantidad = $4,
             id_categoria = $5
         WHERE id_lote = $6
         RETURNING *`,
        [titulo, descripcion, precio, cantidad, id_categoria, req.params.id],
      );

      if (lote.rows.length === 0) {
        return res.status(404).json({ error: "Lote no encontrado" });
      }

      let imagenesFinales = [];

      if (imagenes) {
        try {
          imagenesFinales = JSON.parse(imagenes);
        } catch (error) {
          imagenesFinales = [];
        }
      }

      const files = req.files || [];

      for (let i = 0; i < files.length; i++) {
        imagenesFinales.push(`${BASE_URL}/uploads/${files[i].filename}`);
      }

      if (imagenes || files.length > 0) {
        await pool.query("DELETE FROM Imagen_Lote WHERE id_lote = $1", [
          req.params.id,
        ]);

        for (let i = 0; i < imagenesFinales.length; i++) {
          await pool.query(
            `INSERT INTO Imagen_Lote (id_lote, url, es_principal)
             VALUES ($1,$2,$3)`,
            [req.params.id, imagenesFinales[i], i === 0],
          );
        }
      } else {
        const imagenesQuery = await pool.query(
          "SELECT url FROM Imagen_Lote WHERE id_lote = $1",
          [req.params.id],
        );
        imagenesFinales = imagenesQuery.rows.map((img) => img.url);
      }

      res.json({
        ...lote.rows[0],
        categorias: categoriasNormalizadas,
        imagenes: imagenesFinales,
        imagen: imagenesFinales[0] || null,
      });
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
