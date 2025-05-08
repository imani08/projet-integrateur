import React, { useState, useEffect } from 'react';
import { getAlertSettings, updateAlertSettings } from '../../services/api';
import { Form, Button, Spinner, Alert } from 'react-bootstrap';

const AlertSettings = () => {
  const [settings, setSettings] = useState({
    emailNotifications: false,
    pushNotifications: false,
    thresholds: {}
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getAlertSettings();
        setSettings(data);
        setIsLoading(false);
      } catch (error) {
        setError('Impossible de récupérer les paramètres');
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleThresholdChange = (param, value) => {
    setSettings(prev => ({
      ...prev,
      thresholds: {
        ...prev.thresholds,
        [param]: parseFloat(value)
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateAlertSettings(settings);
      alert('Paramètres d\'alerte mis à jour');
    } catch (error) {
      setError('Erreur lors de la mise à jour des paramètres');
    }
    setIsLoading(false);
  };

  if (isLoading) return <Spinner animation="border" />;

  return (
    <div className="alert-settings">
      <h2>Paramètres des Alertes</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <h3>Notifications</h3>
          <Form.Check
            type="checkbox"
            label="Notifications par email"
            name="emailNotifications"
            checked={settings.emailNotifications}
            onChange={handleChange}
          />
          <Form.Check
            type="checkbox"
            label="Notifications push"
            name="pushNotifications"
            checked={settings.pushNotifications}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <h3>Seuils d'Alerte</h3>
          {Object.entries(settings.thresholds).map(([param, value]) => (
            <Form.Group key={param} className="mb-3">
              <Form.Label>{param}</Form.Label>
              <Form.Control
                type="number"
                value={value}
                onChange={(e) => handleThresholdChange(param, e.target.value)}
              />
            </Form.Group>
          ))}
        </Form.Group>

        <Button variant="primary" type="submit" disabled={isLoading}>
          {isLoading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </Form>
    </div>
  );
};

export default AlertSettings;
