// server.js
const http = require("http");
const WebSocket = require("ws");

const app = require("./app");
const initFirestore = require("./services/initFirestore");
const sensorController = require("./controllers/sensorController"); // <- si tu veux utiliser handleIncomingFromWebSocket

const PORT = process.env.PORT || 5000;

// Crée un serveur HTTP à partir de Express
const server = http.createServer(app);

// Initialise le serveur WebSocket sur le même port
const wss = new WebSocket.Server({ server });

// Gère les connexions WebSocket
wss.on("connection", (ws) => {
  console.log("📡 Client WebSocket connecté");

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);
      await sensorController.handleIncomingFromWebSocket(data);
    } catch (err) {
      console.error("❌ Erreur lors du traitement WebSocket:", err.message);
    }
  });

  ws.on("close", () => {
    console.log("🔌 Client WebSocket déconnecté");
  });
});

// Démarre le serveur HTTP + WebSocket
server.listen(PORT, async () => {
  console.log(`🚀 Serveur Express + WebSocket actif sur http://localhost:${PORT}`);
  await initFirestore();
});
