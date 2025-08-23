const { db, admin } = require("../services/firebase");
const Log = require("../models/log");

const MAX_PER_SENSOR = 5;
const MAX_READ_DOCS = 500; // Limite stricte pour réduire les lectures Firestore

exports.getLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    // --- Lire seulement le nombre minimum nécessaire pour éviter les lectures excessives ---
    const snapshot = await db.collection("logs")
      .orderBy("timestamp", "desc")
      .limit(Math.min(limit * 10, MAX_READ_DOCS)) // ne lit jamais plus de MAX_READ_DOCS
      .get();

    if (snapshot.empty) {
      return res.status(200).json({ logs: [], nextStartAfter: null });
    }

    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // --- Grouper par capteur en excluant la pompe ---
    const groupedBySensor = {};
    for (const log of logs) {
      if (log.name === 'pompe') continue; // Ignorer la pompe
      const sensorId = log.sensorId;
      if (!groupedBySensor[sensorId]) groupedBySensor[sensorId] = [];
      if (groupedBySensor[sensorId].length < MAX_PER_SENSOR) {
        groupedBySensor[sensorId].push(log);
      }
    }

    // --- Concat tous les logs par capteur ---
    const finalLogs = Object.values(groupedBySensor).flat();

    // --- Trier globalement par timestamp décroissant ---
    finalLogs.sort((a, b) => {
      const aTs = a.timestamp.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime();
      const bTs = b.timestamp.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime();
      return bTs - aTs;
    });

    const limitedLogs = finalLogs.slice(0, limit);

    const lastLog = limitedLogs[limitedLogs.length - 1];
    const nextStartAfter = lastLog && lastLog.timestamp
      ? lastLog.timestamp.toDate ? lastLog.timestamp.toDate().toISOString() : new Date(lastLog.timestamp).toISOString()
      : null;

    res.status(200).json({ logs: limitedLogs, nextStartAfter });

  } catch (error) {
    console.error("Erreur récupération logs:", error);
    res.status(500).json({ message: "Erreur serveur: " + error.message });
  }
};
