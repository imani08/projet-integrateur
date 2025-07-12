const app = require("./app");
const initFirestore = require("./services/initFirestore");
//const startMQTT = require("./services/mqttClient");

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  await initFirestore(); // <--- Lancement de l’init automatique ici
  //await startMQTT(); // <--- Lancement du client MQTT ici
});
