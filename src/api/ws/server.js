const { WebSocketServer } = require("ws");

const clients = new Set();

function setupWebSocket(server, apiSecret) {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const secret = url.searchParams.get("secret");

    if (secret !== apiSecret) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });

  wss.on("connection", (ws) => {
    clients.add(ws);
    console.log(`🔌 WebSocket connected. Total: ${clients.size}`);

    ws.on("close", () => {
      clients.delete(ws);
      console.log(`🔌 WebSocket disconnected. Total: ${clients.size}`);
    });

    ws.on("error", (err) => {
      console.error("WebSocket error:", err.message);
      clients.delete(ws);
    });
  });

  return wss;
}

function broadcast(data) {
  const payload = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(payload);
    }
  }
}

module.exports = { setupWebSocket, broadcast };
