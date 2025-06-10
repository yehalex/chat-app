import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? process.env.ALLOWED_ORIGINS.split(",")
    : ["http://localhost:5173", "http://localhost:5174"];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// stores all online users
// {userId: socketId}
const userSocketMap = {};

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    // Emit user connected event
    io.emit("userConnected");
  }

  // broadcast to all connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    if (userId) {
      delete userSocketMap[userId];
      // Emit user disconnected event
      io.emit("userDisconnected");
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
    console.log("A user disconnected", socket.id);
  });
});

export { io, app, server };
