import { db } from './firebase';
import { collection, query,  orderBy, limit, onSnapshot } from 'firebase/firestore';

export const subscribeToSensorData = (callback) => {
  const q = query(
    collection(db, 'sensorData'),
    orderBy('timestamp', 'desc'),
    limit(1)
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const data = querySnapshot.docs[0]?.data();
    callback(data);
  });
};

export const getSensorHistory = async (sensorId) => {
  const snapshot = await db.collection('sensorHistory')
    .where('sensorId', '==', sensorId)
    .orderBy('timestamp', 'desc')
    .limit(100)
    .get();
  
  return snapshot.docs.map(doc => doc.data());
};