import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { RoomManager } from "./rooms.js";

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 30000,
  pingInterval: 10000
});

const roomManager = new RoomManager(io);

// Track socket to roomId mapping
const socketRoomMap = new Map();

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("create-room", (userData, callback) => {
    try {
      const room = roomManager.createRoom(socket, userData);
      socketRoomMap.set(socket.id, room.id);
      console.log(`Room created: ${room.id} by ${userData?.name || socket.id}`);
      if (typeof callback === "function") {
        callback({ success: true, roomId: room.id });
      }
    } catch (err) {
      console.error("Error creating room:", err);
      if (typeof callback === "function") {
        callback({ success: false, error: "Failed to create room" });
      }
    }
  });

  socket.on("join-room", ({ roomId, ...userData }, callback) => {
    try {
      const cleanRoomId = (roomId || "").trim().toUpperCase();
      const room = roomManager.getRoom(cleanRoomId);

      if (!room) {
        if (typeof callback === "function") {
          return callback({ success: false, error: "Room not found!" });
        }
        return;
      }

      if (room.players.length >= 12) {
        if (typeof callback === "function") {
          return callback({ success: false, error: "Room is full (max 12 players)!" });
        }
        return;
      }

      room.addPlayer(socket, userData);
      socketRoomMap.set(socket.id, room.id);
      console.log(`Socket ${socket.id} joined room ${room.id}`);

      if (typeof callback === "function") {
        callback({ success: true, roomId: room.id });
      }
    } catch (err) {
      console.error("Error joining room:", err);
      if (typeof callback === "function") {
        callback({ success: false, error: "Failed to join room" });
      }
    }
  });

  socket.on("quick-play", (userData, callback) => {
    try {
      let room = roomManager.findPublicRoom();
      if (!room) {
        room = roomManager.createRoom(socket, { ...userData, isPublic: true });
      } else {
        room.addPlayer(socket, userData);
      }
      socketRoomMap.set(socket.id, room.id);

      if (typeof callback === "function") {
        callback({ success: true, roomId: room.id });
      }
    } catch (err) {
      console.error("Error in quick-play:", err);
      if (typeof callback === "function") {
        callback({ success: false, error: "Failed to join public room" });
      }
    }
  });

  socket.on("start-game", () => {
    const roomId = socketRoomMap.get(socket.id);
    const room = roomManager.getRoom(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (player && player.isHost) {
      room.startGame();
    }
  });

  socket.on("choose-word", ({ word }) => {
    const roomId = socketRoomMap.get(socket.id);
    const room = roomManager.getRoom(roomId);
    if (!room) return;

    if (room.currentDrawer?.id === socket.id) {
      room.selectWord(word);
    }
  });

  socket.on("draw-stroke", (strokeData) => {
    const roomId = socketRoomMap.get(socket.id);
    const room = roomManager.getRoom(roomId);
    if (!room) return;

    if (room.currentDrawer?.id === socket.id) {
      room.handleDrawStroke(strokeData);
    }
  });

  socket.on("canvas-fill", (fillData) => {
    const roomId = socketRoomMap.get(socket.id);
    const room = roomManager.getRoom(roomId);
    if (!room) return;

    if (room.currentDrawer?.id === socket.id) {
      room.handleCanvasFill(fillData);
    }
  });

  socket.on("canvas-clear", () => {
    const roomId = socketRoomMap.get(socket.id);
    const room = roomManager.getRoom(roomId);
    if (!room) return;

    if (room.currentDrawer?.id === socket.id) {
      room.handleCanvasClear();
    }
  });

  socket.on("send-message", ({ text }) => {
    const roomId = socketRoomMap.get(socket.id);
    const room = roomManager.getRoom(roomId);
    if (!room || !text) return;

    room.handleGuess(socket.id, text);
  });

  socket.on("update-settings", (newSettings) => {
    const roomId = socketRoomMap.get(socket.id);
    const room = roomManager.getRoom(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (player && player.isHost) {
      room.updateSettings(newSettings);
    }
  });

  socket.on("add-bot", () => {
    const roomId = socketRoomMap.get(socket.id);
    const room = roomManager.getRoom(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (player && player.isHost) {
      room.addBot();
    }
  });

  socket.on("restart-game", () => {
    const roomId = socketRoomMap.get(socket.id);
    const room = roomManager.getRoom(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (player && player.isHost) {
      room.restartGame();
    }
  });

  socket.on("leave-room", () => {
    const roomId = socketRoomMap.get(socket.id);
    if (roomId) {
      const room = roomManager.getRoom(roomId);
      if (room) {
        room.removePlayer(socket.id);
      }
      socketRoomMap.delete(socket.id);
      socket.leave(roomId);
    }
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
    const roomId = socketRoomMap.get(socket.id);
    if (roomId) {
      const room = roomManager.getRoom(roomId);
      if (room) {
        room.removePlayer(socket.id);
      }
      socketRoomMap.delete(socket.id);
    }
  });
});

app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "🎨 Skribbl Socket.IO Backend Server is live!",
    activeRooms: roomManager.rooms.size
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", activeRooms: roomManager.rooms.size });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Skribbl backend running on port ${PORT}`);
});
