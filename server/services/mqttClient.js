// services/mqttClient.js
const mqtt = require("mqtt");
const Actuator = require("../models/Actuator"); // Chemin vers ta classe Actuator

function startMQTT() {
  const client = mqtt.connect("mqtt://localhost:1883"); // ou un broker distant

  client.on("connect", () => {
    console.log("✅ Connecté au broker MQTT");
    client.subscribe("actuators/#"); // Abonnement aux topics des actionneurs
  });

  client.on("message", async (topic, message) => {
    try {
      const payload = JSON.parse(message.toString());
      const { name, status } = payload;

      if (!name || !status) {
        console.warn("⛔ Message MQTT invalide:", payload);
        return;
      }

      const result = await Actuator.upsertByName(name, status);
      console.log("✅ Actuator synchronisé via MQTT:", result);
    } catch (err) {
      console.error("❌ Erreur de traitement MQTT:", err.message);
    }
  });

  client.on("error", (err) => {
    console.error("❌ Erreur MQTT:", err);
  });
}

module.exports = startMQTT;
