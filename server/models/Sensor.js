// services/mqttClient.js
const mqtt = require("mqtt");
const Sensor = require("../models/Sensor");
const Actuator = require("../models/Actuator");

function startMQTT() {
  const client = mqtt.connect("mqtt://localhost:1883");

  // Seuils critiques pour l'automatisation
  const SEUILS = {
    humidite: 30,
    thermique: 35,
    co2: 1000,
    luminosite: 150,
  };

  client.on("connect", () => {
    console.log("✅ Connecté au broker MQTT");
    client.subscribe("capteurs/#");
    client.subscribe("actuators/#");
  });

  client.on("message", async (topic, message) => {
    try {
      const payload = JSON.parse(message.toString());

      // === CAPTEURS ===
      if (topic.startsWith("capteurs/")) {
        const { type, value, unit } = payload;

        if (!type || value === undefined || !unit) {
          console.warn("⛔ Donnée capteur invalide:", payload);
          return;
        }

        console.log(`📥 Capteur ${type}: ${value}${unit}`);

        // 1. Sauvegarde dans Firestore
        await Sensor.create({ type, value, unit, createdAt: new Date() });

        // 2. Vérification seuils + déclenchement action
        if (type === "humidite" && value < SEUILS.humidite) {
          await declencher("pompe_irrigation", "on");
        }

        if (type === "thermique" && value > SEUILS.thermique) {
          await declencher("ventilateur", "on");
        }

        if (type === "co2" && value > SEUILS.co2) {
          await declencher("ventilateur", "on");
        }

        if (type === "luminosite" && value < SEUILS.luminosite) {
          await declencher("lumiere", "on");
        }
      }

      // === ACTIONNEURS ===
      if (topic.startsWith("actuators/")) {
        const { name, status } = payload;

        if (!name || !status) {
          console.warn("⛔ Message actionneur invalide:", payload);
          return;
        }

        const result = await Actuator.upsertByName(name, status);
        console.log("✅ Actuator synchronisé:", result);
      }

    } catch (err) {
      console.error("❌ Erreur de traitement MQTT:", err.message);
    }
  });

  client.on("error", (err) => {
    console.error("❌ Erreur MQTT:", err);
  });

  // Fonction pour envoyer commande à un actionneur + enregistrer dans Firestore
  async function declencher(name, status) {
    const message = JSON.stringify({ name, status });
    const topic = `actuators/${name}`;

    client.publish(topic, message);
    await Actuator.upsertByName(name, status);
    console.log(`⚙️ Action automatique déclenchée: ${name} → ${status}`);
  }
}

module.exports = startMQTT;
