import "dotenv/config";
import http from "node:http";
import app from "./app.js";
import { Server } from "socket.io";

const port = Number(process.env.PORT || 5000);
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }
});

// Socket event handlers and JWT room authorization will be added in the next phase.
io.on("connection", (socket) => {
  socket.emit("server-ready", { connected: true });
});

server.listen(port, () => {
  console.log(`BoardCollab API listening on port ${port}`);
});
