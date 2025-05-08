const { db } = require("./firebase");

const initFirestore = async () => {
  try {
    // Capteurs
    const sensorsRef = db.collection("sensors");
    const snapshotSensors = await sensorsRef.limit(1).get();
    if (snapshotSensors.empty) {
      // Insérer des capteurs de test
      const testSensors = [
        {
          name: "Température",
          type: "thermique",
          value: 22, // valeur de test
          unit: "°C",
          createdAt: new Date(),
        },
        {
          name: "Humidité du sol",
          type: "humidite",
          value: 60, // valeur de test
          unit: "%",
          createdAt: new Date(),
        },
        {
          name: "CO₂",
          type: "co2",
          value: 400, // valeur de test
          unit: "ppm",
          createdAt: new Date(),
        },
        {
          name: "Luminosité",
          type: "luminosite",
          value: 200, // valeur de test
          unit: "lux",
          createdAt: new Date(),
        },
        {
          name: "Niveau d'eau",
          type: "niveau_eau",
          value: 50, // valeur de test
          unit: "%",
          createdAt: new Date(),
        },
      ];

      // Ajouter les capteurs de test à la collection
      for (let sensor of testSensors) {
        await sensorsRef.add(sensor);
      }
      console.log("📡 Collection 'sensors' initialisée avec des données de test");
    }

    // Actionneurs
    const actuatorsRef = db.collection("actuators");
    const snapshotActuators = await actuatorsRef.limit(1).get();
    if (snapshotActuators.empty) {
      await actuatorsRef.add({
        name: "Pompe à eau",
        status: "off",
        zone: "Zone A",
        createdAt: new Date(),
      });
      console.log("🔌 Collection 'actuators' initialisée avec un actionneur");
    }

    // Alertes
    const alertsRef = db.collection("alerts");
    const snapshotAlerts = await alertsRef.limit(1).get();
    if (snapshotAlerts.empty) {
      await alertsRef.add({
        message: "Humidité trop basse",
        level: "critique",
        timestamp: new Date(),
      });
      console.log("🚨 Collection 'alerts' initialisée avec une alerte");
    }

    // Utilisateurs
    const usersRef = db.collection("users");
    const snapshotUsers = await usersRef.limit(1).get();
    if (snapshotUsers.empty) {
      await usersRef.add({
        name: "Admin",
        email: "admin@smart-agri.com",
        role: "admin",
        createdAt: new Date(),
      });
      console.log("👤 Collection 'users' initialisée avec un utilisateur");
    }

  } catch (err) {
    console.error("❌ Erreur lors de l'initialisation de Firestore :", err);
  }
};

module.exports = initFirestore;
