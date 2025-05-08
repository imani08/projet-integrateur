import api from './axios';

// 🔥 FIREBASE - TEMPS RÉEL
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import { app } from './firebase'; // 🔁 Assure-toi que ce fichier initialise Firebase correctement

const db = getFirestore(app);

// ✅ SENSORS
export const getSensorData = async () => {
  try {
    const response = await api.get('/sensors');
    const sensors = response.data;

    const nameToKeyMap = {
      'Température': 'temperature',
      'Humidité du sol': 'humidity',
      'CO₂': 'co2',
      'Niveau de CO₂': 'co2',  // Ajout du nom "Niveau de CO₂"
      'Luminosité': 'light',
      "Niveau d'eau": 'waterLevel'
    };

    console.log("Capteurs reçus:", sensors);

    return sensors.reduce((acc, sensor) => {
      console.log(`Nom du capteur: ${sensor.name}`);  // Vérifie le nom du capteur reçu
      const key = nameToKeyMap[sensor.name];

      if (key) {
        console.log(`Mapping ${sensor.name} à ${key}: ${sensor.value}`);
        acc[key] = sensor.value;
      } else {
        console.warn(`Nom de capteur non mappé: ${sensor.name}`);
      }

      return acc;
    }, {
      temperature: 0,
      humidity: 0,
      co2: 0,
      light: 0,
      waterLevel: 0
    });

  } catch (error) {
    console.error("Erreur lors de la récupération des capteurs:", error);
    throw error;  // Lève l'erreur pour être traitée dans le composant
  }
};


export const getSensors = async () => {
  const response = await api.get('/sensors/');
  return response.data;
};

// ✅ 🔁 TEMPS RÉEL - capteurs (Firebase)
export const subscribeToSensors = (onUpdate) => {
  return onSnapshot(collection(db, 'sensors'), (snapshot) => {
    const sensors = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    onUpdate(sensors);
  });
};

export const getSensorHistory = async (sensorId) => {
  const response = await api.get(`/sensors/${sensorId}/history`);
  return response.data;
};

// ✅ SENSORS - CREATE / UPDATE / DELETE
export const createSensor = async (sensorData) => {
  const response = await api.post('/sensors', sensorData);
  return response.data;
};

export const updateSensor = async (id, sensorData) => {
  const response = await api.put(`/sensors/${id}`, sensorData);
  return response.data;
};

export const deleteSensor = async (id) => {
  const response = await api.delete(`/sensors/${id}`);
  return response.data;
};

// ✅ ACTUATORS
// ✅ ACTUATORS
export const getActuators = async () => {
  const response = await api.get('/actuators');
  return response.data.map(actuator => ({
    id: actuator.id,
    name: actuator.name,
    status: actuator.status,
    zone: actuator.zone,
    createdAt: actuator.createdAt
  }));
};

export const toggleActuator = async (id) => {
  const response = await api.patch(`/actuators/${id}/toggle`);
  return response.data;
};

export const addActuator = async (data) => {
  const response = await api.post('/actuators', data);
  return response.data;
};
// 🔁 TEMPS RÉEL - Actionneurs
export const subscribeToActuators = (onUpdate) => {
  return onSnapshot(collection(db, 'actuators'), (snapshot) => {
    const actuators = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    onUpdate(actuators);
  });
};

export const updateActuator = async (id, data) => {
  const response = await api.put(`/actuators/${id}`, data);
  return response.data;
};

export const deleteActuator = async (id) => {
  const response = await api.delete(`/actuators/${id}`);
  return response.data;
};


// ✅ ALERTS
export const getAlerts = async () => {
  const response = await api.get('/alerts');
  return response.data;
};

export const getAlertSettings = async () => {
  const response = await api.get('/alerts/settings');
  return response.data;
};

export const updateAlertSettings = async (settings) => {
  const response = await api.post('/alerts/settings', settings);
  return response.data;
};

// ✅ SETTINGS
export const getSystemSettings = async () => {
  const response = await api.get('/settings');
  return response.data;
};

export const updateSystemSettings = async (settings) => {
  const response = await api.post('/settings', settings);
  return response.data;
};

// ✅ USER
export const updateUserProfile = async (profileData) => {
  const response = await api.put('/users/profile', profileData);
  return response.data;
};

// ✅ LOGS
export const getLogs = async () => {
  const response = await api.get('/logs');
  return response.data;
};

// ✅ DASHBOARD

export const getUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

export const assignUserRole = async (uid, role) => {
  // Validation des entrées
  if (!uid) {
    const errorMsg = 'assignUserRole - L\'ID utilisateur est requis';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const validRoles = ['admin', 'manager', 'technician', 'viewer'];
  if (!validRoles.includes(role)) {
    const errorMsg = `assignUserRole - Le rôle '${role}' n'est pas valide`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    console.log("Tentative de mise à jour du rôle:", { uid, role });

    // Ajout d'un timestamp pour le debug
    const timestamp = new Date().toISOString();
    
    // Affichage du payload envoyé à l'API pour vérification
    console.log("Payload envoyé à l'API:", {
      role,
      updatedAt: timestamp
    });

    const response = await api.patch(`/users/set-role/${uid}`, {
      role,
      updatedAt: timestamp
    });

    // Vérification du code de réponse HTTP
    if (response.status !== 200 && response.status !== 204) {
      const errorMsg = `assignUserRole - Erreur HTTP: ${response.status}`;
      console.error(errorMsg, response.data);
      throw new Error(errorMsg);
    }

    console.log("Mise à jour du rôle réussie", response.data);
    return response.data;

  } catch (error) {
    const errorDetails = {
      message: error.message,
      response: error.response?.data,
      uid,
      role
    };
    
    // Log détaillé de l'erreur
    console.error("Échec de l'attribution du rôle:", errorDetails);

    // Vérification des détails de la réponse d'erreur
    if (error.response) {
      console.error("Détails de la réponse d'erreur:", error.response);
    }

    // Lancer une erreur avec les détails
    throw new Error(error.response?.data?.error || 
                   `Échec de la mise à jour du rôle: ${error.message}`);
  }
};




