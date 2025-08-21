const Actuator = require("../models/Actuator");
const { db } = require('../services/firebase');
const { broadcast } = require('../services/websocketService');

const actuatorController = {
  async getAll(req, res) {
    try {
      const actuators = await Actuator.getAll();
      res.json(actuators);
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de la récupération des actionneurs" });
    }
  },

  async getById(req, res) {
    try {
      const actuator = await Actuator.getById(req.params.id);
      if (!actuator) return res.status(404).json({ error: "Actionneur non trouvé" });
      res.json(actuator);
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de la récupération de l'actionneur" });
    }
  },
  async toggleStatus(req, res) {
    try {
      const updated = await Actuator.toggleStatus(req.params.id);
      if (!updated) return res.status(404).json({ error: 'Actionneur non trouvé' });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: "Erreur lors du changement de statut de l'actionneur" });
    }
  },
  async toggleStatus(req, res) {
    try {
      const updated = await Actuator.toggleStatus(req.params.id);
      if (!updated) return res.status(404).json({ error: 'Actionneur non trouvé' });
      res.json(updated);
    } catch (err) {
      console.error("Erreur serveur dans toggleStatus:", err); // 👈 AIDE AU DEBUG
      res.status(500).json({ error: "Erreur lors du changement de statut de l'actionneur" });
    }
  },
  

  async create(req, res) {
    try {
      const newActuator = await Actuator.create(req.body);
      res.status(201).json(newActuator);
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de la création de l'actionneur" });
    }
  },

  async update(req, res) {
    const { id } = req.params;
    const updateData = req.body;
  
    try {
      console.log("Tentative de mise à jour de l'actuateur avec l'ID:", id);
      const actuatorRef = db.collection('actuators').doc(id);
  
      const doc = await actuatorRef.get();
      if (!doc.exists) {
        console.log("Actuateur non trouvé pour l'ID:", id);
        return res.status(404).json({ error: "Actuateur non trouvé" });
      }
  
      console.log("Actuateur trouvé, mise à jour des données...");
      await actuatorRef.update(updateData);
  
      const updatedDoc = await actuatorRef.get();
      console.log("Actuateur mis à jour:", updatedDoc.data());
  
      res.json(updatedDoc.data());
    } catch (err) {
      console.error("Erreur lors de la mise à jour :", err);
      res.status(500).json({ error: "Erreur lors de la mise à jour de l'actionneur" });
    }
  },

  async delete(req, res) {
    try {
      await Actuator.delete(req.params.id);
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de la suppression de l'actionneur" });
    }
  },
  
  /**
   * Endpoint utilisé par l'ESP32 (POST /esp32/status)
   * Accepte un payload JSON et upsert/update les actionneurs (pompe, relay, etc.)
   */
 async sendStatusToESP32(req, res) {
  try {
    const data = req.body; // ex: { pompe: 'on', relay: 'off' }

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      console.log("[ESP32] Données invalides :", data);
      return res.status(400).json({ error: "Données invalides reçues" });
    }

    console.log("[ESP32] Données reçues :", data);

    const actuatorsCollection = db.collection('actuators');
    const logsCollection = db.collection('actuatorLogs'); // historique
    const INTERVAL_MINUTES = 5;
    const MAX_LOGS = 5;

    const updatedActuators = [];

    for (const [rawKey, rawValue] of Object.entries(data)) {
      const key = rawKey.toLowerCase().trim(); // nom canonique
      const value = ["on", "true", "1", "yes", true].includes(rawValue.toString().toLowerCase()) ? true : false;

      let actuatorId;
      let actuatorRef;

      // Cherche l'actionneur existant
      const snap = await actuatorsCollection.where('name', '==', key).limit(1).get();
      if (!snap.empty) {
        actuatorRef = snap.docs[0].ref;
        actuatorId = snap.docs[0].id;
        await actuatorRef.update({ status: value, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      } else {
        const newDoc = await actuatorsCollection.add({
          name: key,
          status: value,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        actuatorRef = newDoc;
        actuatorId = newDoc.id;
      }

      // Limite de logs pour éviter de spammer Firestore
      const cutoffDate = new Date(Date.now() - INTERVAL_MINUTES * 60000);
      const cutoffTs = admin.firestore.Timestamp.fromDate(cutoffDate);

      await db.runTransaction(async (transaction) => {
        const recentSnap = await transaction.get(
          logsCollection
            .where('actuatorId', '==', actuatorId)
            .where('timestamp', '>', cutoffTs)
        );

        if (recentSnap.size < MAX_LOGS) {
          const logRef = logsCollection.doc();
          transaction.set(logRef, {
            actuatorId,
            name: key,
            status: value,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`Log actionneur enregistré : ${key} = ${value}`);
        } else {
          console.log(`⛔ Limite atteinte pour ${key} dans les ${INTERVAL_MINUTES} dernières minutes`);
        }
      });

      // Broadcast temps réel
      try {
        broadcast({ type: "actuatorStatus", id: actuatorId, name: key, status: value });
        console.log(`[ESP32] Broadcast envoyé : ${key} => ${value}`);
      } catch (e) {
        console.warn("[ESP32] Erreur broadcast:", e.message || e);
      }

      updatedActuators.push({ name: key, status: value });
    }

    return res.json({
      success: true,
      message: "Actionneur(s) mis à jour et listener activé",
      data: updatedActuators
    });

  } catch (err) {
    console.error("[ESP32] Erreur lors de l'envoi du statut :", err);
    return res.status(500).json({ error: "Erreur lors de l'envoi du statut" });
  }
}


};

module.exports = actuatorController;
