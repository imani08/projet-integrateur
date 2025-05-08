const { db } = require("../services/firebase");

class Alert {
  constructor(message, level = "warning", sensorId = null, createdAt = new Date()) {
    this.message = message;
    this.level = level;
    this.sensorId = sensorId;
    this.createdAt = createdAt;
  }

  static async getAll() {
    const snapshot = await db.collection("alerts").get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  static async create(data) {
    const docRef = await db.collection("alerts").add(data);
    return { id: docRef.id };
  }
}

module.exports = Alert;
