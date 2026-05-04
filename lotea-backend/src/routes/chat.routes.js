const express = require("express");
const router = express.Router();
const pool = require("../db/connection");

const ensureChatTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS Conversation (
      id SERIAL PRIMARY KEY,
      participants INTEGER[] NOT NULL,
      lote_id INTEGER NOT NULL REFERENCES Lote(id_lote) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (lote_id, participants)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS Message (
      id SERIAL PRIMARY KEY,
      conversation_id INTEGER NOT NULL REFERENCES Conversation(id) ON DELETE CASCADE,
      sender_id INTEGER NOT NULL REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
      text TEXT NOT NULL,
      read BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'conversation'
          AND column_name = 'created_at'
          AND data_type = 'timestamp without time zone'
      ) THEN
        ALTER TABLE Conversation
        ALTER COLUMN created_at TYPE TIMESTAMPTZ
        USING created_at AT TIME ZONE 'UTC';
      END IF;
    END $$;
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'message'
          AND column_name = 'created_at'
          AND data_type = 'timestamp without time zone'
      ) THEN
        ALTER TABLE Message
        ALTER COLUMN created_at TYPE TIMESTAMPTZ
        USING created_at AT TIME ZONE 'UTC';
      END IF;
    END $$;
  `);

  await pool.query(`
    ALTER TABLE Message
    ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false
  `);
};

const normalizeConversation = (row) => ({
  id: row.id,
  participants: row.participants,
  loteId: row.loteId,
  createdAt: row.createdAt,
  loteTitulo: row.loteTitulo,
  loteImagen: row.loteImagen,
  sellerId: row.sellerId,
  otherUserId: row.otherUserId,
  otherUserName: row.otherUserName,
  otherUserAvatar: row.otherUserAvatar,
  lastMessage: row.lastMessage,
  lastMessageAt: row.lastMessageAt,
  unreadCount: Number(row.unreadCount || 0),
});

const normalizeMessage = (row) => ({
  id: row.id,
  conversationId: row.conversationId,
  senderId: row.senderId,
  text: row.text,
  read: row.read,
  createdAt: row.createdAt,
});

const getConversationById = async (conversationId) => {
  await ensureChatTables();

  const result = await pool.query(
    `
    SELECT
      id,
      participants,
      lote_id AS "loteId",
      created_at AS "createdAt"
    FROM Conversation
    WHERE id = $1
    `,
    [conversationId],
  );

  return result.rows[0] ? normalizeConversation(result.rows[0]) : null;
};

const createMessage = async ({ conversationId, senderId, text }) => {
  await ensureChatTables();

  const cleanText = String(text || "").trim();

  if (!conversationId || !senderId || !cleanText) {
    throw new Error("Datos de mensaje incompletos");
  }

  const result = await pool.query(
    `
    INSERT INTO Message (conversation_id, sender_id, text)
    VALUES ($1, $2, $3)
    RETURNING
      id,
      conversation_id AS "conversationId",
      sender_id AS "senderId",
      text,
      read,
      created_at AS "createdAt"
    `,
    [conversationId, senderId, cleanText],
  );

  return normalizeMessage(result.rows[0]);
};

const markMessagesAsRead = async ({ conversationId, userId }) => {
  await ensureChatTables();

  if (!conversationId || !userId) {
    throw new Error("Datos de lectura incompletos");
  }

  const result = await pool.query(
    `
    UPDATE Message
    SET read = true
    WHERE conversation_id = $1
      AND sender_id <> $2
      AND read = false
    RETURNING id
    `,
    [conversationId, userId],
  );

  return result.rowCount;
};

const findOrCreateConversation = async ({ buyerId, sellerId, loteId }) => {
  await ensureChatTables();

  if (!buyerId || !sellerId || !loteId) {
    throw new Error("Datos de conversacion incompletos");
  }

  const participants = [Number(buyerId), Number(sellerId)].sort(
    (a, b) => a - b,
  );

  const result = await pool.query(
    `
    INSERT INTO Conversation (participants, lote_id)
    VALUES ($1, $2)
    ON CONFLICT (lote_id, participants)
    DO UPDATE SET lote_id = EXCLUDED.lote_id
    RETURNING
      id,
      participants,
      lote_id AS "loteId",
      created_at AS "createdAt"
    `,
    [participants, loteId],
  );

  return normalizeConversation(result.rows[0]);
};

router.get("/conversations/:userId", async (req, res) => {
  try {
    await ensureChatTables();

    const userId = Number(req.params.userId);

    const result = await pool.query(
      `
      SELECT
        c.id,
        c.participants,
        c.lote_id AS "loteId",
        c.created_at AS "createdAt",
        l.titulo AS "loteTitulo",
        l.id_vendedor AS "sellerId",
        i.url AS "loteImagen",
        other_user.id_usuario AS "otherUserId",
        other_user.nombre AS "otherUserName",
        other_user.avatar AS "otherUserAvatar",
        last_message.text AS "lastMessage",
        last_message.created_at AS "lastMessageAt",
        unread_count.total AS "unreadCount"
      FROM Conversation c
      LEFT JOIN Lote l ON l.id_lote = c.lote_id
      LEFT JOIN Imagen_Lote i ON i.id_lote = c.lote_id AND i.es_principal = true
      LEFT JOIN LATERAL (
        SELECT participant_id
        FROM unnest(c.participants) AS participant_id
        WHERE participant_id <> $1
        LIMIT 1
      ) other_participant ON true
      LEFT JOIN Usuario other_user
        ON other_user.id_usuario = other_participant.participant_id
      LEFT JOIN LATERAL (
        SELECT text, created_at
        FROM Message
        WHERE conversation_id = c.id
        ORDER BY created_at DESC
        LIMIT 1
      ) last_message ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS total
        FROM Message
        WHERE conversation_id = c.id
          AND sender_id <> $1
          AND read = false
      ) unread_count ON true
      WHERE $1 = ANY(c.participants)
        AND last_message.created_at IS NOT NULL
      ORDER BY COALESCE(last_message.created_at, c.created_at) DESC
      `,
      [userId],
    );

    res.json(result.rows.map(normalizeConversation));
  } catch (error) {
    console.error("ERROR GET CONVERSATIONS:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/conversations", async (req, res) => {
  try {
    const conversation = await findOrCreateConversation(req.body);
    res.json(conversation);
  } catch (error) {
    console.error("ERROR POST CONVERSATION:", error);
    res.status(500).json({ error: error.message });
  }
});

router.delete("/conversations/:conversationId", async (req, res) => {
  try {
    await ensureChatTables();

    await pool.query("DELETE FROM Conversation WHERE id = $1", [
      req.params.conversationId,
    ]);

    res.json({ ok: true });
  } catch (error) {
    console.error("ERROR DELETE CONVERSATION:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/messages/:conversationId", async (req, res) => {
  try {
    await ensureChatTables();

    const result = await pool.query(
      `
      SELECT
        id,
        conversation_id AS "conversationId",
        sender_id AS "senderId",
        text,
        read,
        created_at AS "createdAt"
      FROM Message
      WHERE conversation_id = $1
      ORDER BY created_at ASC
      `,
      [req.params.conversationId],
    );

    res.json(result.rows.map(normalizeMessage));
  } catch (error) {
    console.error("ERROR GET MESSAGES:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/messages", async (req, res) => {
  try {
    const message = await createMessage(req.body);
    res.json(message);
  } catch (error) {
    console.error("ERROR POST MESSAGE:", error);
    res.status(500).json({ error: error.message });
  }
});

router.put("/messages/read/:conversationId", async (req, res) => {
  try {
    const updated = await markMessagesAsRead({
      conversationId: req.params.conversationId,
      userId: req.body.userId,
    });

    res.json({ ok: true, updated });
  } catch (error) {
    console.error("ERROR PUT MESSAGES READ:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
module.exports.ensureChatTables = ensureChatTables;
module.exports.getConversationById = getConversationById;
module.exports.createMessage = createMessage;
module.exports.markMessagesAsRead = markMessagesAsRead;
