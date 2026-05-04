const express = require("express");
const cors = require("cors");
const pool = require("./db/connection");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json());

// Servir archivos estáticos (uploads)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Rutas
const lotesRoutes = require("./routes/lotes.routes");
const authRoutes = require("./routes/auth.routes");
const categoriasRoutes = require("./routes/categorias.routes");
const pedidosRoutes = require("./routes/pedidos.routes");
const favoritosRoutes = require("./routes/favoritos.routes");
const chatRoutes = require("./routes/chat.routes");

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
app.use("/favoritos", favoritosRoutes);
app.use("/chat", chatRoutes);

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  if (userId) {
    socket.join(String(userId));
  }

  socket.on("join_user", (id) => {
    if (id) socket.join(String(id));
  });

  socket.on("send_message", async (data) => {
    try {
      const message = await chatRoutes.createMessage(data);
      const conversation = await chatRoutes.getConversationById(
        message.conversationId,
      );

      if (!conversation) return;

      conversation.participants.forEach((participantId) => {
        io.to(String(participantId)).emit("receive_message", { message });
      });
    } catch (error) {
      console.error("ERROR SOCKET SEND_MESSAGE:", error);
    }
  });

  socket.on("mark_as_read", async (data) => {
    try {
      await chatRoutes.markMessagesAsRead(data);
      const conversation = await chatRoutes.getConversationById(
        data.conversationId,
      );

      if (!conversation) return;

      conversation.participants
        .filter((participantId) => participantId !== Number(data.userId))
        .forEach((participantId) => {
          io.to(String(participantId)).emit("messages_read", {
            conversationId: Number(data.conversationId),
          });
        });
    } catch (error) {
      console.error("ERROR SOCKET MARK_AS_READ:", error);
    }
  });
});

// Puerto al final
const PORT = 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
