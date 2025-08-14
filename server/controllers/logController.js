const { db } = require("../services/firebase");

/**
 * Récupère les logs depuis Firestore avec pagination
 * @route GET /api/logs
 * @queryParam {number} limit - Nombre de logs à récupérer (par défaut 50)
 * @queryParam {string} startAfter - Timestamp ISO du dernier log pour pagination
 */
exports.getLogs = async (req, res) => {
  try {
    // Lecture des paramètres de requête
    const limit = parseInt(req.query.limit) || 50;
    const startAfter = req.query.startAfter ? new Date(req.query.startAfter) : null;

    // Construction de la requête Firestore
    let query = db.collection("logs")
                  .orderBy("timestamp", "desc")
                  .limit(limit);

    if (startAfter) {
      query = query.startAfter(startAfter);
    }

    const snapshot = await query.get();

    // Si aucun log trouvé, on renvoie un tableau vide
    if (snapshot.empty) {
      return res.status(200).json({ logs: [], nextStartAfter: null });
    }

    // Transformation des documents Firestore en objets JSON
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Timestamp du dernier log pour pagination
    const lastLog = logs[logs.length - 1];
    const nextStartAfter = lastLog && lastLog.timestamp ? lastLog.timestamp.toDate() : null;

    res.status(200).json({
      logs,
      nextStartAfter
    });

  } catch (error) {
    console.error("Erreur récupération logs:", error);
    res.status(500).json({ message: "Erreur serveur: " + error.message });
  }
};
