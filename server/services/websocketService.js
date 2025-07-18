const WebSocket = require('ws');
const sensorController = require('../controllers/sensorController');

exports.initWebSocketServer = (server) => {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('📶 ESP32 connecté via WebSocket');

    ws.on('message', async (message) => {
      try {
        // Vérifier que le message est une chaîne JSON valide avant de parser
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
    });

    ws.on('error', (error) => {
      console.error('❌ Erreur WebSocket:', error.message);
    });
  });
};
