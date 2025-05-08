import React, { useEffect, useState } from 'react';
import { 
  getSensors, 
  createSensor, 
  updateSensor, 
  deleteSensor 
} from '../../services/api';
import { 
  Table, Container, Row, Col, Card, 
  Spinner, Alert, Badge, Button,
  Modal, Form
} from 'react-bootstrap';
import { 
  FaSync, FaExclamationTriangle, FaEdit, 
  FaTrash, FaPlus, FaThermometerHalf,
  FaTint, FaSun, FaCloud, FaWater
} from 'react-icons/fa';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const SensorList = () => {
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentSensor, setCurrentSensor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'temperature',
    value: '',
    unit: '°C'
  });

  // Noms de capteurs autorisés
  const allowedSensorNames = {
    temperature: "Température",
    soil_humidity: "Humidité du sol",
    co2: "Niveau de CO₂",
    light: "Luminosité",
    water_level: "Niveau d'eau"
  };

  // Types de capteurs disponibles avec leurs unités et icônes
  const sensorTypes = {
    temperature: { unit: '°C', icon: <FaThermometerHalf /> },
    soil_humidity: { unit: '%', icon: <FaWater /> },
    co2: { unit: 'ppm', icon: <FaCloud /> },
    light: { unit: 'lux', icon: <FaSun /> },
    water_level: { unit: 'cm', icon: <FaTint /> }
  };

  const fetchSensors = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSensors();
      setSensors(data);
    } catch (err) {
      console.error("Failed to fetch sensors:", err);
      setError("Échec du chargement des capteurs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSensors();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'type' ? { unit: sensorTypes[value]?.unit || '' } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation supplémentaire
    if (!Object.values(allowedSensorNames).includes(formData.name)) {
      setError("Nom de capteur non valide");
      return;
    }

    try {
      setLoading(true);
      if (currentSensor) {
        await updateSensor(currentSensor.id, formData);
      } else {
        await createSensor(formData);
      }
      setShowModal(false);
      await fetchSensors();
    } catch (err) {
      console.error("Operation failed:", err);
      setError(`Échec de ${currentSensor ? 'mise à jour' : 'création'} du capteur`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Confirmer la suppression de ce capteur ?")) {
      try {
        setLoading(true);
        await deleteSensor(id);
        await fetchSensors();
      } catch (err) {
        console.error("Delete failed:", err);
        setError("Échec de la suppression du capteur");
      } finally {
        setLoading(false);
      }
    }
  };

  const openEditModal = (sensor) => {
    setCurrentSensor(sensor);
    setFormData({
      name: sensor.name,
      type: sensor.type,
      value: sensor.value,
      unit: sensor.unit
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setCurrentSensor(null);
    setFormData({
      name: '',
      type: 'temperature',
      value: '',
      unit: '°C'
    });
    setShowModal(true);
  };

  const getStatusColor = (value, type) => {
    if (type === 'temperature') {
      if (value > 40) return 'danger';
      if (value > 30) return 'warning';
      return 'success';
    }
    if (type === 'soil_humidity') {
      if (value > 80) return 'danger';
      if (value > 60) return 'warning';
      return 'success';
    }
    if (type === 'co2') {
      if (value > 1000) return 'danger';
      if (value > 800) return 'warning';
      return 'success';
    }
    if (type === 'light') {
      if (value > 10000) return 'danger';
      if (value > 5000) return 'warning';
      return 'success';
    }
    if (type === 'water_level') {
      if (value < 10) return 'danger';
      if (value < 20) return 'warning';
      return 'success';
    }
    return 'primary';
  };

  return (
    <Container className="my-4">
      <Row className="mb-3">
        <Col>
          <h2>
            <FaThermometerHalf className="me-2" />
            Gestion des Capteurs
          </h2>
        </Col>
        <Col className="text-end">
          <Button variant="primary" onClick={openCreateModal}>
            <FaPlus className="me-1" />
            Ajouter un Capteur
          </Button>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          <FaExclamationTriangle className="me-2" />
          {error}
        </Alert>
      )}

      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <span>Liste des Capteurs ({sensors.length})</span>
          <Button 
            variant="outline-secondary" 
            size="sm" 
            onClick={fetchSensors}
            disabled={loading}
          >
            <FaSync className={loading ? "me-1 spin" : "me-1"} />
            Actualiser
          </Button>
        </Card.Header>

        <Card.Body>
          {loading && sensors.length === 0 ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
              <p className="mt-3">Chargement en cours...</p>
            </div>
          ) : (
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Type</th>
                  <th>Valeur</th>
                  <th>Statut</th>
                  <th>Créé le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sensors.map((sensor) => (
                  <tr key={sensor.id}>
                    <td>{sensor.name}</td>
                    <td>
                      <Badge bg="info">
                        {sensorTypes[sensor.type]?.icon} {sensor.type}
                      </Badge>
                    </td>
                    <td>
                      {sensor.value} 
                      <small className="text-muted ms-1">{sensor.unit}</small>
                    </td>
                    <td>
                      <Badge bg={getStatusColor(sensor.value, sensor.type)}>
                        {sensor.value} {sensor.unit}
                      </Badge>
                    </td>
                    <td>
                      {sensor.createdAt && !isNaN(new Date(sensor.createdAt)) 
                        ? format(new Date(sensor.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr }) 
                        : '-'}
                    </td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="me-2"
                        onClick={() => openEditModal(sensor)}
                      >
                        <FaEdit />
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDelete(sensor.id)}
                      >
                        <FaTrash />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}

          {!loading && sensors.length === 0 && (
            <Alert variant="info">
              Aucun capteur trouvé. Cliquez sur "Ajouter un Capteur" pour commencer.
            </Alert>
          )}
        </Card.Body>
      </Card>

      {/* Modal pour créer/modifier */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {currentSensor ? 'Modifier le Capteur' : 'Nouveau Capteur'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nom du Capteur</Form.Label>
              <Form.Select
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              >
                <option value="">Sélectionnez un nom</option>
                {Object.entries(allowedSensorNames).map(([key, name]) => (
                  <option key={key} value={name}>
                    {name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <Form.Select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
              >
                {Object.keys(sensorTypes).map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Valeur</Form.Label>
              <Form.Control
                type="number"
                name="value"
                value={formData.value}
                onChange={handleInputChange}
                required
              />
              <Form.Text className="text-muted">
                Unité: {formData.unit}
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? (
                <Spinner animation="border" size="sm" />
              ) : currentSensor ? (
                'Enregistrer'
              ) : (
                'Créer'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default SensorList;