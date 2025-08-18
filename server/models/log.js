// models/Log.js
const { db, admin } = require('../services/firebase');

class Log {
  constructor({ sensorId, name, value, type, unit, timestamp }) {
    this.sensorId = sensorId;      // ID du capteur associé
    this.name = name;              // Nom lisible du capteur (ex: "Température")
    this.value = value;            // Valeur mesurée
    this.type = type;              // Type de capteur ("temperature", "humidity", "gas", "unknown")
    this.unit = unit;              // Unité de mesure ("°C", "%", "ppm", etc.)
    this.timestamp = timestamp || admin.firestore.FieldValue.serverTimestamp(); // Date de l'enregistrement
  }

  // Ajoute ce log dans Firestore
  async save() {
    try {
      const logsCollection = db.collection('logs');
      const docRef = await logsCollection.add({
        sensorId: this.sensorId,
        name: this.name,
        value: this.value,
        type: this.type,
        unit: this.unit,
        timestamp: this.timestamp
      });
      return docRef.id;
    } catch (err) {
      console.error("Erreur lors de l'enregistrement du log :", err);
      throw err;
    }
  }

  // Récupère les derniers logs (optionnel, par exemple pour afficher un historique)
  static async getLast(limit = 50) {
    try {
      const snapshot = await db.collection('logs')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error("Erreur lors de la récupération des logs :", err);
      throw err;
    }
  }
}

module.exports = Log;
