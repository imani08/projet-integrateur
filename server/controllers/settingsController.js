const { db } = require("../services/firebase");

exports.getSettings = async (req, res) => {
  try {
    const doc = await db.collection("settings").doc("global").get();
    if (!doc.exists) return res.status(404).json({ message: "Paramètres non définis" });

    res.json(doc.data());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    await db.collection("settings").doc("global").set(req.body, { merge: true });
    res.json({ message: "Paramètres mis à jour." });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
