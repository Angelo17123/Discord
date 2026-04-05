const express = require("express");
const cors = require("cors");
const http = require("http");
const { WebSocketServer } = require("ws");

const dataRoutes = require("./routes/data");
const actionRoutes = require("./routes/actions");
const { setupWebSocket, broadcast } = require("./ws/server");

class ApiServer {
  constructor() {
    this.app = express();
    this.server = null;
    this.wss = null;
  }

  init(client, sessionManager) {
    this.client = client;
    this.sessionManager = sessionManager;

    this.app.use(cors({
      origin: process.env.DASHBOARD_URL || "http://localhost:3000",
      credentials: true,
    }));
    this.app.use(express.json());

    this.app.use((req, res, next) => {
      const secret = req.headers["x-bot-api-secret"];
      if (secret !== process.env.BOT_API_SECRET) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      next();
    });

    this.app.use("/api/data", dataRoutes);
    this.app.use("/api/actions", actionRoutes(client, sessionManager, broadcast));

    this.server = http.createServer(this.app);
    this.wss = setupWebSocket(this.server, process.env.BOT_API_SECRET);

    this.broadcast = broadcast;

    return this;
  }

  start(port) {
    return new Promise((resolve) => {
      this.server.listen(port, "0.0.0.0", () => {
        console.log(`✅ API server listening on port ${port}`);
        resolve();
      });
    });
  }
}

module.exports = new ApiServer();
