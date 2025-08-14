const { db, admin } = require("../services/firebase");
const Log = require("../models/Log");

/**
 * Récupère les logs depuis Firestore avec pagination
 * @route GET /api/logs
 * @queryParam {number} limit - Nombre de logs à récupérer (par défaut 50)
 * @queryParam {string} startAfter - Timestamp ISO du dernier log pour pagination
 */
exports.getLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const startAfter = req.query.startAfter
      ? admin.firestore.Timestamp.fromDate(new Date(req.query.startAfter))
      : null;

    let query = db.collection("logs")
                  .orderBy("timestamp", "desc")
                  .limit(limit);

    if (startAfter) {
      query = query.startAfter(startAfter);
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
      return res.status(200).json({ logs: [], nextStartAfter: null });
    }

    // Transformer les documents Firestore en instances du modèle Log
    const logs = snapshot.docs.map(doc => new Log({ id: doc.id, ...doc.data() }));

    // Timestamp du dernier log pour la pagination
    const lastLog = logs[logs.length - 1];
    const nextStartAfter = lastLog && lastLog.timestamp 
      ? lastLog.timestamp.toDate().toISOString()
      : null;

    res.status(200).json({
      logs,
      nextStartAfter
    });

  } catch (error) {
    console.error("Erreur récupération logs:", error);
    res.status(500).json({ message: "Erreur serveur: " + error.message });
  }
};
