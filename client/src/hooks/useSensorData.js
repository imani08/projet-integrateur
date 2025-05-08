import { useState, useEffect } from 'react';
import { subscribeToSensorData } from '../services/sensorService';
import { Spinner, Alert } from 'react-bootstrap';

export const useSensorData = () => {
  const [sensorData, setSensorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToSensorData(
      (data) => {
        setSensorData(data);
        setLoading(false);
      },
      (err) => {
        setError('Erreur de récupération des données');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  return { sensorData, loading, error };
};
