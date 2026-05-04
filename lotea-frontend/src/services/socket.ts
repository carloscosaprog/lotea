import { io } from "socket.io-client";

import { API_URL } from "../config/api";

export const socket = io(API_URL, {
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
