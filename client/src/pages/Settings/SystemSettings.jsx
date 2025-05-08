import React, { useState, useEffect } from 'react';
import { getSystemSettings, updateSystemSettings } from '../../services/api';
import { Container, Row, Col, Form, Button, Alert, Card } from 'react-bootstrap';

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    irrigationThreshold: 0,
    temperatureThreshold: 0,
    co2Threshold: 0,
    lightThreshold: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSystemSettings();
        setSettings(data);
        setIsLoading(false);
      } catch (err) {
        setError('Erreur lors du chargement des paramètres.');
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: parseFloat(value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateSystemSettings(settings);
      setSuccess('Paramètres mis à jour avec succès');
      setError('');
    } catch (err) {
      setError('Erreur lors de la mise à jour des paramètres');
      setSuccess('');
    }
    setIsLoading(false);
  };

  if (isLoading) return <div>Chargement...</div>;

  return (
    <Container className="system-settings">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card>
            <Card.Body>
              <Card.Title>Paramètres du Système</Card.Title>
              {success && <Alert variant="success">{success}</Alert>}
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group controlId="irrigationThreshold">
                  <Form.Label>Seuil d'irrigation (%)</Form.Label>
                  <Form.Control
                    type="number"
                    name="irrigationThreshold"
                    value={settings.irrigationThreshold}
                    onChange={handleChange}
                    step="0.1"
                  />
                </Form.Group>

                <Form.Group controlId="temperatureThreshold">
                  <Form.Label>Seuil de température (°C)</Form.Label>
                  <Form.Control
                    type="number"
                    name="temperatureThreshold"
                    value={settings.temperatureThreshold}
                    onChange={handleChange}
                    step="0.1"
                  />
                </Form.Group>

                <Form.Group controlId="co2Threshold">
                  <Form.Label>Seuil de CO₂ (ppm)</Form.Label>
                  <Form.Control
                    type="number"
                    name="co2Threshold"
                    value={settings.co2Threshold}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Form.Group controlId="lightThreshold">
                  <Form.Label>Seuil de luminosité (lux)</Form.Label>
                  <Form.Control
                    type="number"
                    name="lightThreshold"
                    value={settings.lightThreshold}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Button variant="primary" type="submit" className="mt-3" disabled={isLoading}>
                  {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SystemSettings;
