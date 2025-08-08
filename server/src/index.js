import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { connectDB } from "./db.js";
import { config } from "./config.js";
import authRoutes from "./routes/auth.js";
import historyRoutes from "./routes/history.js";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import { onlineUsers, setOnline, setOffline, listOnline } from "./presence.js";

const app = express();
app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
app.use(express.json());

app.get("/", (_, res) => res.send("P2P Share API OK"));
app.use("/api/auth", authRoutes);
app.use("/api/history", historyRoutes);

app.get("/api/users/online", async (req, res) => {
  return res.json({ users: listOnline() });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: config.CORS_ORIGIN, methods: ["GET", "POST"] },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("No auth token"));
  try {
    const payload = jwt.verify(token, config.JWT_SECRET);
    socket.user = payload; // { id, username }
    next();
  } catch (e) {
    next(new Error("Invalid token"));
  }
});

io.on("connection", async (socket) => {
  const { id: userId, username } = socket.user;
  setOnline(userId, socket.id, username);
  await User.findByIdAndUpdate(userId, { online: true, lastSeen: new Date() });

  io.emit("presence:update", listOnline());

  // track active sessions by room (for this socket)
  const roomToSessionId = new Map();

  // Connection request flow
  socket.on("connect:request", ({ toUserId }) => {
    const target = onlineUsers.get(toUserId);
    if (!target) return;
    io.to(target.socketId).emit("connect:incoming", { fromUserId: userId, fromUsername: username });
  });

  socket.on("connect:accept", async ({ fromUserId }) => {
    const caller = onlineUsers.get(fromUserId);
    if (!caller) return;
    const room = [userId, fromUserId].sort().join(":");
    socket.join(room);
    io.to(caller.socketId).emit("connect:accepted", { room, peerUserId: userId, peerUsername: username });
    io.to(socket.id).emit("connect:accepted", { room, peerUserId: fromUserId, peerUsername: caller.username });

    // Create a session history record when accepted
    try {
      const { Session } = await import("./models/Session.js");
      const sess = await Session.create({
        users: [fromUserId, userId],
        initiator: fromUserId,
        room,
        acceptedAt: new Date(),
      });
      roomToSessionId.set(room, sess._id.toString());
      // update contacts lastConnectedAt (basic upsert-like behavior)
      await User.updateOne(
        { _id: userId, "contacts.userId": fromUserId },
        { $set: { "contacts.$.lastConnectedAt": new Date() } }
      );
      await User.updateOne(
        { _id: userId, "contacts.userId": { $ne: fromUserId } },
        { $push: { contacts: { userId: fromUserId, username: caller.username, lastConnectedAt: new Date() } } }
      );
      await User.updateOne(
        { _id: fromUserId, "contacts.userId": userId },
        { $set: { "contacts.$.lastConnectedAt": new Date() } }
      );
      await User.updateOne(
        { _id: fromUserId, "contacts.userId": { $ne: userId } },
        { $push: { contacts: { userId, username, lastConnectedAt: new Date() } } }
      );
    } catch (e) {
      console.error("session create error", e.message);
    }
  });

  // WebRTC signaling relay (server does NOT handle media/data)
  socket.on("signal:offer", ({ room, sdp }) => {
    socket.to(room).emit("signal:offer", { sdp, from: userId });
  });
  socket.on("signal:answer", ({ room, sdp }) => {
    socket.to(room).emit("signal:answer", { sdp, from: userId });
  });
  socket.on("signal:ice", ({ room, candidate }) => {
    socket.to(room).emit("signal:ice", { candidate, from: userId });
  });

  // Save file metadata for history
  socket.on("history:file", async ({ room, files }) => {
    try {
      const { Session } = await import("./models/Session.js");
      let sessId = roomToSessionId.get(room);
      let sess = null;
      if (!sessId) {
        // fallback: look up latest session by room
        sess = await Session.findOne({ room }).sort({ acceptedAt: -1, startedAt: -1 });
        if (sess) sessId = sess._id.toString();
      } else {
        sess = await Session.findById(sessId);
      }
      if (!sess) return;
      const docs = (files || []).map(f => ({ name: f.name, size: f.size, by: userId }));
      await Session.updateOne({ _id: sessId }, { $push: { files: { $each: docs } } });
    } catch (e) {
      console.error("history:file error", e.message);
    }
  });

  socket.on("disconnect", async () => {
    try {
      // End all sessions for rooms this socket was part of
      const { Session } = await import("./models/Session.js");
      for (const [room, sessId] of Array.from(roomToSessionId.entries())) {
        await Session.findByIdAndUpdate(sessId, { endedAt: new Date() });
        roomToSessionId.delete(room);
      }
    } catch (e) {
      console.error("session end error", e.message);
    }
    setOffline(userId);
    await User.findByIdAndUpdate(userId, { online: false, lastSeen: new Date() });
    io.emit("presence:update", listOnline());
  });
});

connectDB().then(() => {
  server.listen(config.PORT, () => console.log("Server listening", config.PORT));
});