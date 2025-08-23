const Sensor = require("../models/Sensor");
const Actuator = require("../models/Actuator");
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
  
sensorCache: {}, // Cache côté serveur: name -> { id, lastLogTimestamp }

async handleIncomingFromWebSocket(data) {
  try {
    if (!data || typeof data !== 'object') {
      throw new Error("Données invalides reçues du WebSocket");
    }

    const sensorsCollection = db.collection('sensors');
    const actuatorsCollection = db.collection('actuators');
    const logsCollection = db.collection('logs');
    const batch = db.batch();

    const INTERVAL_MINUTES = 5;
    const now = new Date();
    const cutoffMs = INTERVAL_MINUTES * 60000;

    for (const [key, value] of Object.entries(data)) {
      const type = key === 'temperature' ? 'temperature'
                 : key === 'soil' ? 'humidity'
                 : key === 'gas' ? 'gas'
                 : key === 'pompe' ? 'actuator'
                 : 'unknown';
      const unit = key === 'temperature' ? '°C'
                 : key === 'soil' ? '%' 
                 : key === 'gas' ? 'ppm' : '';
      const name = key === 'soil' ? 'Humidité du sol'
                 : key === 'temperature' ? 'Température'
                 : key === 'gas' ? 'Gaz'
                 : key === 'pompe' ? 'Pompe'
                 : key;

      let sensorDocRef, sensorId;

      // --- Gestion de l'actionneur ---
      if (key === 'pompe') {
        const result = await Actuator.upsertByName("Pompe", value);
        sensorId = result.id;
        sensorDocRef = actuatorsCollection.doc(sensorId);

        // Mise à jour valeur en temps réel
        await sensorDocRef.update({
          value,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

      } else {
        // --- Capteur classique ---
        const cacheEntry = this.sensorCache[name];
        if (cacheEntry) {
          sensorId = cacheEntry.id;
          sensorDocRef = sensorsCollection.doc(sensorId);
        } else {
          const existingSensorSnapshot = await sensorsCollection
            .where('name', '==', name)
            .limit(1)
            .get();

          if (!existingSensorSnapshot.empty) {
            const doc = existingSensorSnapshot.docs[0];
            sensorId = doc.id;
            sensorDocRef = doc.ref;
          } else {
            const newDocRef = sensorsCollection.doc();
            batch.set(newDocRef, {
              name,
              value,
              type,
              unit,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              lastLogTimestamp: admin.firestore.FieldValue.serverTimestamp()
            });
            sensorId = newDocRef.id;
            sensorDocRef = newDocRef;
          }

          // S'assurer que le cache existe
          this.sensorCache[name] = { id: sensorId, lastLogTimestamp: 0 };
        }

        // Mise à jour valeur en temps réel
        await sensorDocRef.update({
          value,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // --- Gestion des logs toutes les 5 min ---
      // S'assurer que le cache existe avant d'accéder à lastLogTimestamp
      if (!this.sensorCache[name]) {
        this.sensorCache[name] = { id: sensorId, lastLogTimestamp: 0 };
      }

      let lastLogTime = this.sensorCache[name].lastLogTimestamp || 0;
      if (!lastLogTime) {
        const sensorDoc = await sensorDocRef.get();
        lastLogTime = sensorDoc.exists && sensorDoc.data().lastLogTimestamp
          ? sensorDoc.data().lastLogTimestamp.toMillis()
          : 0;
      }

      if (now.getTime() - lastLogTime >= cutoffMs) {
        const newLogRef = logsCollection.doc();
        batch.set(newLogRef, {
          sensorId,
          name,
          value,
          type,
          unit,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        batch.update(sensorDocRef, {
          lastLogTimestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        // Mettre à jour lastLogTimestamp dans le cache
        this.sensorCache[name].lastLogTimestamp = now.getTime();

        console.log(`Log programmé : ${name} = ${value}${unit}`);
      } else {
        console.log(`⛔ Limite atteinte pour ${name}`);
      }
    }

    // --- Commit batch pour logs ---
    await batch.commit();
    console.log("Batch Firestore exécuté avec succès");

  } catch (err) {
    console.error("Erreur dans handleIncomingFromWebSocket :", err);
    console.error("Données reçues :", data);
  }
}

};


module.exports = sensorController;
