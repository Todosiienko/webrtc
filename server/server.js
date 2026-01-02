const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

/**
 * rooms = {
 *   roomId: Set<WebSocket>
 * }
 */
const rooms = new Map();

wss.on("connection", (ws) => {
  ws.roomId = null;

  ws.on("message", (message) => {
    console.log('raw msg',message.toString());
    const data = JSON.parse(message);
    console.log('parsed msg', data)
    switch (data.type) {
      case "join":
        ws.peerType = data.peerType;
        ws.role = data.role;
        joinRoom(ws, data.roomId);

        break;

      case "signal":
        broadcastSignal(ws, data);
        break;

      case "leave":
        leaveRoom(ws);
        break;
    }
  });

  ws.on("close", () => {
    leaveRoom(ws);
  });
});

function joinRoom(ws, roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  console.log(`Client joined room ${roomId} | type=${ws.peerType} role=${ws.role}`);

  rooms.get(roomId).add(ws);
  ws.roomId = roomId;

  // повідомити інших
  broadcast(ws, {
    type: "peer-joined",
  });
}

function leaveRoom(ws) {
  const roomId = ws.roomId;
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (!room) return;

  room.delete(ws);

  if (room.size === 0) {
    rooms.delete(roomId);
  }

  broadcast(ws, { type: "peer-left" });

  console.log(`Client left room ${roomId}`);
}

function broadcastSignal(ws, data) {
  broadcast(ws, {
    type: "signal",
    signal: data.signal,
  });
}

function broadcast(sender, message) {
  const room = rooms.get(sender.roomId);
  if (!room) return;

  for (const client of room) {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }
}

server.listen(3000, () => {
  console.log("Signaling server running on http://localhost:3000");
});
