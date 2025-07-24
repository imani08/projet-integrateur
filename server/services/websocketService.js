const WebSocket = require('ws');
const sensorController = require('../controllers/sensorController');

let wss;
const clients = new Set(); // Pour garder la liste des clients connectés

exports.initWebSocketServer = (server) => {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('📶 ESP32 connecté via WebSocket');
    clients.add(ws);

    ws.on('message', async (message) => {
      try {
        if (typeof message !== 'string') {
          console.warn('⚠️ Message reçu non textuel, ignoré');
          return;
        }

        const data = JSON.parse(message);
        await sensorController.handleIncomingFromWebSocket(data);

      } catch (err) {
        console.error('❌ Erreur lors du traitement du message WebSocket:', err.message);
      }
    });

    ws.on('close', () => {
      console.log('🔌 ESP32 déconnecté');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('❌ Erreur WebSocket:', error.message);
    });
  });
};

// Fonction pour envoyer un message JSON à **tous** les clients (broadcast)
exports.broadcast = (data) => {
  const message = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
};

// Fonction pour envoyer un message JSON à un client spécifique (optionnel)
// Par exemple si tu veux cibler un client selon un critère (à adapter selon ton cas)
exports.sendToClient = (client, data) => {
  if (client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(data));
  }
};
