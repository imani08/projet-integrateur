import React, { useEffect, useState } from 'react';
import { getAlerts } from '../../services/api';
import { Card, ListGroup, Alert } from 'react-bootstrap';

const AlertList = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      const data = await getAlerts();
      setAlerts(data);
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000); // Actualisation toutes les 10 secondes
    return () => clearInterval(interval); // Nettoyage du timer
  }, []);

  return (
    <Card className="mb-4 shadow">
      <Card.Header className="bg-danger text-white">Alertes Récentes</Card.Header>
      <Card.Body>
        <ListGroup>
          {alerts.map((alert) => (
            <ListGroup.Item key={alert.id} className={`alert-${alert.severity}`}>
              <Alert variant={alert.severity === 'high' ? 'danger' : 'warning'}>
                <Alert.Heading>{alert.title}</Alert.Heading>
                <p>{alert.message}</p>
                <footer className="text-muted">
                  {new Date(alert.timestamp).toLocaleString()}
                </footer>
              </Alert>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Card.Body>
    </Card>
  );
};

export default AlertList;
