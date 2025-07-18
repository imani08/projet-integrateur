const Sensor = require("../models/Sensor");
const { db, admin } = require('../services/firebase');




const sensorController = {
  async getAll(req, res) {
    try {
      const snapshot = await db.collection('sensors').get();
      const sensors = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt || admin.firestore.FieldValue.serverTimestamp()
      }));
      res.json(sensors);
    } catch (err) {
      console.error("Erreur lors de la récupération des capteurs:", err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  // Fonction pour récupérer un capteur par ID
  async getById(req, res) {
    try {
      const doc = await db.collection('sensors').doc(req.params.id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: "Capteur non trouvé" });
      }
      res.json({
        id: doc.id,
        ...doc.data()
      });
    } catch (err) {
      console.error("Erreur lors de la récupération du capteur:", err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  async getById(id) {
    try {
      const doc = await db.collection('sensors').doc(id).get();
      if (!doc.exists) return null;
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (err) {
      throw err;
    }
  },


  async getById(req, res) {
    try {
      const sensor = await Sensor.getById(req.params.id);
      if (sensor) {
        // Conversion de `createdAt` si nécessaire
        if (sensor.createdAt && sensor.createdAt.toDate) {
          sensor.createdAt = sensor.createdAt.toDate();
        }
        res.json(sensor);
      } else {
        res.status(404).json({ error: "Not found" });
      }
    } catch (err) {
      console.error("Erreur getById:", err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  async create(req, res) {
    try {
      const result = await Sensor.create(req.body);
      res.status(201).json(result);
    } catch (err) {
      console.error("Erreur création sensor:", err);
      res.status(500).json({ error: "Erreur création" });
    }
  },

  async update(req, res) {
    try {
      const updated = await Sensor.update(req.params.id, req.body);
      res.json(updated);
    } catch (err) {
      console.error("Erreur mise à jour sensor:", err);
      res.status(500).json({ error: "Erreur mise à jour" });
    }
  },

  async delete(req, res) {
    try {
      await Sensor.deleteById(req.params.id);
      res.status(204).end();
    } catch (err) {
      console.error("Erreur suppression sensor:", err);
      res.status(500).json({ error: "Erreur suppression" });
    }
  },
  async  handleIncomingFromWebSocket(data) {
  try {
    // ✅ Validation stricte
    if (
      !data ||
      typeof data !== 'object' ||
      typeof data.name !== 'string' ||
      typeof data.value === 'undefined'
    ) {
      throw new Error("Données invalides reçues du WebSocket");
    }

    const sensorsCollection = db.collection('sensors');

    // 🔍 Recherche d'un capteur existant avec le même nom
    const existingSensorSnapshot = await sensorsCollection
      .where('name', '==', data.name)
      .limit(1)
      .get();

    if (!existingSensorSnapshot.empty) {
      // 🔄 Mise à jour du champ 'value' uniquement
      const docRef = existingSensorSnapshot.docs[0].ref;

      await docRef.update({
        value: data.value,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`🔄 Capteur '${data.name}' mis à jour`);
    } else {
      // ➕ Nouveau document
      const newSensor = {
        name: data.name,
        value: data.value,
        unit: data.unit || '', // Par défaut vide si non fourni
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const newDocRef = await sensorsCollection.add(newSensor);
      console.log(`✅ Nouveau capteur '${data.name}' créé (ID: ${newDocRef.id})`);
    }

  } catch (err) {
    console.error("❌ Erreur dans handleIncomingFromWebSocket:", err.message, data);
  }
}
};



module.exports = sensorController;
