import { io } from "socket.io-client";

const SOCKET_URL = "http://192.168.0.65:3000";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket"],
});

export const connectSocket = (userId: number) => {
  const opts = socket.io.opts as { query?: Record<string, string> };
  opts.query = { userId: String(userId) };

  if (!socket.connected) {
    socket.connect();
    return;
  }

  socket.emit("join_user", userId);
};
