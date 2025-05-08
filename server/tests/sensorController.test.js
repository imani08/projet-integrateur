const admin = require('firebase-admin');
const test = require('firebase-functions-test')();
const { db } = require('../config/firebase');
const sensorController = require('../controllers/sensorController');

describe('Sensor Controller', () => {
  beforeAll(async () => {
    // Ajouter des données de test
    await db.collection('sensorData').add({
      temperature: 25,
      humidity: 60,
      co2: 400,
      light: 1000,
      waterLevel: 80,
      timestamp: new Date()
    });
  });

  afterAll(async () => {
    // Nettoyer les données de test
    const snapshot = await db.collection('sensorData').get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    test.cleanup();
  });

  it('should get latest sensor data', async () => {
    const req = {};
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    await sensorController.getSensorData(req, res);
    expect(res.json).toHaveBeenCalled();
    const responseData = res.json.mock.calls[0][0];
    expect(responseData).toHaveProperty('temperature');
    expect(responseData).toHaveProperty('humidity');
  });
});