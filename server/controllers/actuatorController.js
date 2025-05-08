const Actuator = require("../models/Actuator");
const { db } = require('../services/firebase');

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
  }
};

module.exports = actuatorController;
