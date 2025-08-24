const Actuator = require("../models/Actuator");
const { db } = require('../services/firebase');
const { broadcast } = require('../services/websocketService');

 const actuatorCache = {}; // Cache côté serveur: key -> lastLogTimestamp

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
    const data = req.body; // ex: { pompe: 'on', relay: 'off' }

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      console.log("[ESP32] Données invalides :", data);
      return res.status(400).json({ error: "Données invalides reçues" });
    }

    const actuatorsCollection = db.collection('actuators');
    const logsCollection = db.collection('actuatorLogs');
    const INTERVAL_MINUTES = 5;
    const cutoffMs = INTERVAL_MINUTES * 60000;
    const batch = db.batch();

    const now = Date.now();

    // ⚡ Réponse finale basée sur Firestore (priorité pour ESP32)
    const firestoreStates = {};

    for (const [rawKey, rawValue] of Object.entries(data)) {
      const key = rawKey.toLowerCase().trim();
      const value = ["on", "true", "1", "yes", true].includes(
        rawValue.toString().toLowerCase()
      );

      let actuatorRef, actuatorId;
      let currentStatus = value; // valeur par défaut (si pas trouvé en DB)

      // Vérifier si l'actionneur existe déjà dans Firestore
      const snap = await actuatorsCollection.where('name', '==', key).limit(1).get();
      if (!snap.empty) {
        actuatorRef = snap.docs[0].ref;
        actuatorId = snap.docs[0].id;
        const docData = snap.docs[0].data();

        // ⚡ L'état Firestore est prioritaire
        currentStatus = docData.status ?? value;
      } else {
        // Créer un nouvel actionneur
        const newDoc = actuatorsCollection.doc();
        batch.set(newDoc, {
          name: key,
          status: value,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastLogTimestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        actuatorRef = newDoc;
        actuatorId = newDoc.id;
      }

      // Vérifier limite pour les logs
      const lastLogTime = actuatorCache[key] || 0;
      if (now - lastLogTime >= cutoffMs) {
        const logRef = logsCollection.doc();
        batch.set(logRef, {
          actuatorId,
          name: key,
          status: currentStatus,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        batch.update(actuatorRef, {
          lastLogTimestamp: admin.firestore.FieldValue.serverTimestamp(),
          status: currentStatus,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        actuatorCache[key] = now;
        console.log(`Log actionneur planifié : ${key} = ${currentStatus}`);
      }

      // ⚡ Réponse ESP32 = état Firestore prioritaire
      firestoreStates[key] = currentStatus ? "on" : "off";
    }

    // Commit Firestore si nécessaire
    if (batch._ops && batch._ops.length > 0) {
      await batch.commit();
      console.log("Batch Firestore exécuté avec succès");
    }

    // Broadcast temps réel (frontend)
    try {
      Object.entries(firestoreStates).forEach(([name, status]) => {
        broadcast({ type: "actuatorStatus", name, status });
      });
    } catch (e) {
      console.warn("[ESP32] Erreur broadcast:", e.message || e);
    }

    // ⚡ Réponse directe ESP32 (basée sur Firestore en priorité)
    return res.json({
      success: true,
      actuators: firestoreStates
      // ex: { pompe: "on", relay: "off" }
    });

  } catch (err) {
    console.error("[ESP32] Erreur sendStatusToESP32 :", err);
    return res.status(500).json({ error: "Erreur lors de l'envoi du statut" });
  }
}

};

module.exports = actuatorController;
