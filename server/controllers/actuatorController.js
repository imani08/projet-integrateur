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
  
  async sendStatusToESP32(req, res) {
    try {
      const { id, name } = req.params; // id optionnel, name nécessaire si création
      const newStatus = req.body.status;

      if (typeof newStatus === 'undefined') {
        return res.status(400).json({ error: "Statut manquant dans la requête" });
      }

      let actuatorData;

      // 1️⃣ Récupérer ou créer l'actionneur
      if (id) {
        const actuatorRef = db.collection("actuators").doc(id);
        const snap = await actuatorRef.get();

        if (!snap.exists) {
          if (!name) return res.status(400).json({ error: "Nom requis pour créer un nouvel actionneur" });
          actuatorData = await Actuator.upsertByName(name, newStatus);
        } else {
          await actuatorRef.update({ status: newStatus, updatedAt: new Date() });
          actuatorData = { id: snap.id, ...snap.data(), status: newStatus };
        }
      } else {
        if (!name) return res.status(400).json({ error: "Nom requis pour créer un actionneur" });
        actuatorData = await Actuator.upsertByName(name, newStatus);
      }

      const actuatorRef = db.collection("actuators").doc(actuatorData.id);

      // 2️⃣ Envoi initial du statut
      broadcast({
        type: "actuatorStatus",
        id: actuatorData.id,
        status: actuatorData.status
      });

      // 3️⃣ Listener temps réel global (évite doublons)
      if (!listenersMap.has(actuatorData.id)) {
        const unsubscribe = actuatorRef.onSnapshot((doc) => {
          if (doc.exists) {
            const data = doc.data();
            broadcast({
              type: "actuatorStatus",
              id: doc.id,
              status: data.status
            });
          }
        });
        listenersMap.set(actuatorData.id, unsubscribe);
      }

      res.json({
        success: true,
        message: "Statut mis à jour et listener temps réel activé pour l'ESP32",
        data: actuatorData
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors de l'envoi du statut" });
    }
  }
};

module.exports = actuatorController;
