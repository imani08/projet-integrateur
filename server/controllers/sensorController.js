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
  
async handleIncomingFromWebSocket(data) {
  try {
    if (!data || typeof data !== 'object') {
      throw new Error("Données invalides reçues du WebSocket");
    }

    const sensorsCollection = db.collection('sensors');
    const logsCollection = db.collection('logs');

    const INTERVAL_MINUTES = 5;
    const MAX_LOGS = 15;

    // pour chaque mesure reçue
    for (const [key, value] of Object.entries(data)) {
      const type = key === 'temperature' ? 'temperature'
                 : key === 'soil' ? 'humidity'
                 : key === 'gas' ? 'gas' : 'unknown';

      const unit = key === 'temperature' ? '°C'
                 : key === 'soil' ? '%'
                 : key === 'gas' ? 'ppm' : '';

      const name = key === 'soil' ? 'Humidité du sol'
                 : key === 'temperature' ? 'Température'
                 : key === 'gas' ? 'Gaz' : key;

      // cherche capteur existant
      const existingSensorSnapshot = await sensorsCollection
        .where('name', '==', name)
        .limit(1)
        .get();

      let sensorId;
      let sensorDocRef;

      if (!existingSensorSnapshot.empty) {
        const doc = existingSensorSnapshot.docs[0];
        sensorDocRef = doc.ref;
        sensorId = doc.id;

        // mise à jour de la valeur (non-transactionnelle, ok ici)
        await sensorDocRef.update({
          value: value,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        // création capteur
        const newSensor = {
          name,
          value,
          type,
          unit,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        const newDocRef = await sensorsCollection.add(newSensor);
        sensorId = newDocRef.id;
        sensorDocRef = newDocRef;
      }

      // calcul cutoff comme Timestamp firestore
      const now = new Date();
      const cutoffDate = new Date(now.getTime() - INTERVAL_MINUTES * 60000);
      const cutoffTs = admin.firestore.Timestamp.fromDate(cutoffDate);

      // transaction atomique : lire les logs récents et n'ajouter que si < MAX_LOGS
      await db.runTransaction(async (transaction) => {
        // Exécuter la query via transaction.get
        const recentQuery = logsCollection
          .where("sensorId", "==", sensorId)
          .where("timestamp", ">", cutoffTs);

        const recentSnap = await transaction.get(recentQuery);

        if (recentSnap.size < MAX_LOGS) {
          const newLogRef = logsCollection.doc(); // doc id auto
          transaction.set(newLogRef, {
            sensorId,
            name,
            value,
            type,
            unit,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
          // debug
          console.log(`Log enregistré (transaction) : ${name} = ${value}${unit}`);
        } else {
          console.log(`⛔ Limite atteinte : ${MAX_LOGS} logs déjà pour ${name} dans les ${INTERVAL_MINUTES} dernières minutes.`);
        }
      });
    }

  } catch (err) {
    console.error("Erreur dans handleIncomingFromWebSocket :", err);
    // si tu veux plus de détail
    if (err && err.code) console.error("Code erreur Firestore :", err.code, err.details || "");
    console.error("Données reçues :", data);
  }
}



};


module.exports = sensorController;
