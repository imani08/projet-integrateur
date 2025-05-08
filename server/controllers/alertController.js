const Alert = require("../models/Alert");

const alertController = {
  // Récupérer toutes les alertes
  async getAll(req, res) {
    try {
      const alerts = await Alert.getAll();
      res.status(200).json(alerts);
    } catch (err) {
      console.error("Erreur getAll:", err);
      res.status(500).json({ error: "Impossible de récupérer les alertes." });
    }
  },

  // Récupérer une alerte spécifique par ID
  async getById(req, res) {
    try {
      const alert = await Alert.getById(req.params.id);
      if (!alert) {
        return res.status(404).json({ error: "Alerte non trouvée." });
      }
      res.status(200).json(alert);
    } catch (err) {
      console.error("Erreur getById:", err);
      res.status(500).json({ error: "Erreur lors de la récupération de l'alerte." });
    }
  },

  // Créer une nouvelle alerte (envoyée par un capteur via ESP32)
  async create(req, res) {
    try {
      const { type, niveau, message, source, date } = req.body;

      if (!type || !niveau || !source) {
        return res.status(400).json({ error: "Champs requis manquants." });
      }

      const newAlert = await Alert.create({
        type,
        niveau,
        message: message || "Alerte détectée.",
        source,
        date: date || new Date().toISOString()
      });

      res.status(201).json({ message: "Alerte enregistrée avec succès.", data: newAlert });
    } catch (err) {
      console.error("Erreur create:", err);
      res.status(500).json({ error: "Erreur lors de la création de l'alerte." });
    }
  },

  // Mettre à jour une alerte (ex : pour ajouter un statut traité)
  async update(req, res) {
    try {
      const updatedAlert = await Alert.update(req.params.id, req.body);
      if (!updatedAlert) {
        return res.status(404).json({ error: "Alerte non trouvée." });
      }
      res.status(200).json({ message: "Alerte mise à jour avec succès.", data: updatedAlert });
    } catch (err) {
      console.error("Erreur update:", err);
      res.status(500).json({ error: "Erreur lors de la mise à jour de l'alerte." });
    }
  },

  // Supprimer une alerte
  async delete(req, res) {
    try {
      const deleted = await Alert.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Alerte non trouvée." });
      }
      res.status(204).end();
    } catch (err) {
      console.error("Erreur delete:", err);
      res.status(500).json({ error: "Erreur lors de la suppression de l'alerte." });
    }
  }
};

module.exports = alertController;
