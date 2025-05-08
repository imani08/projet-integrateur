const { db } = require("../services/firebase");

exports.getLogs = async (req, res) => {
  try {
    // Récupère les logs depuis Firestore, triés par timestamp et limités à 50
    const snapshot = await db.collection("logs")
                              .orderBy("timestamp", "desc")
                              .limit(50)
                              .get();

    // Si aucun log n'est trouvé
    if (snapshot.empty) {
      return res.status(404).json({ message: "Aucun log trouvé." });
    }

    // Transformation des documents Firestore en format JSON
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Envoi de la réponse avec les logs
    res.json(logs);
  } catch (err) {
    // Gestion des erreurs, envoi d'un message d'erreur approprié
    console.error("Erreur lors de la récupération des logs: ", err);
    res.status(500).json({ message: "Erreur serveur: " + err.message });
  }
};
