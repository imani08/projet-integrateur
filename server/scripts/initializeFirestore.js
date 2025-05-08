const { db } = require('../config/firebase');

const initializeCollections = async () => {
  // Création des collections si elles n'existent pas
  const collections = ['sensors', 'actuators', 'sensorData', 'actuatorLogs', 'users'];
  
  for (const collection of collections) {
    const snapshot = await db.collection(collection).limit(1).get();
    if (snapshot.empty) {
      // Ajout d'un document vide pour créer la collection
      await db.collection(collection).doc('init').set({ initialized: true });
      console.log(`Collection ${collection} initialisée`);
    }
  }

  // Données par défaut pour les capteurs
  const defaultSensors = [
    { name: 'Capteur Température', type: 'temperature', unit: '°C' },
    { name: 'Capteur Humidité Sol', type: 'soil_humidity', unit: '%' },
    { name: 'Capteur CO2', type: 'co2', unit: 'ppm' },
    { name: 'Capteur Luminosité', type: 'light', unit: 'lux' },
    { name: 'Capteur Niveau Eau', type: 'water_level', unit: '%' }
  ];

  for (const sensor of defaultSensors) {
    const existing = await db.collection('sensors').where('type', '==', sensor.type).get();
    if (existing.empty) {
      await db.collection('sensors').add(sensor);
    }
  }

  // Données par défaut pour les actionneurs
  const defaultActuators = [
    { name: 'Pompe Irrigation', type: 'water_pump', status: false },
    { name: 'Ventilateur Serre', type: 'fan', status: false },
    { name: 'Éclairage', type: 'light', status: false }
  ];

  for (const actuator of defaultActuators) {
    const existing = await db.collection('actuators').where('type', '==', actuator.type).get();
    if (existing.empty) {
      await db.collection('actuators').add(actuator);
    }
  }

  console.log('Initialisation de Firestore terminée');
};

initializeCollections().catch(console.error);