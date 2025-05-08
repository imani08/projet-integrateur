const { db } = require("../services/firebase");

class Sensor {
  constructor(type, value, unit, createdAt = new Date()) {
    this.type = type;
    this.value = value;
    this.unit = unit;
    this.createdAt = createdAt;
  }

  static async getAll() {
    const snapshot = await db.collection("sensors").orderBy("createdAt", "desc").get();
  
    const latestByType = {};
    const typeToName = {
      thermique: "Température",
      humidite: "Humidité du sol",
      co2: "Niveau de CO₂",
      luminosite: "Luminosité",
      eau: "Niveau d'eau"
    };
  
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const type = data.type;
      if (!latestByType[type]) {
        latestByType[type] = {
          id: doc.id,
          name: typeToName[type] || type,
          ...data
        };
      }
    });
  
    return Object.values(latestByType);
  }
  

  static async create(data) {
    const docRef = await db.collection("sensors").add(data);
    return { id: docRef.id };
  }

  static async getById(id) {
    const doc = await db.collection("sensors").doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  static async deleteById(id) {
    await db.collection("sensors").doc(id).delete();
  }
}

module.exports = Sensor;
