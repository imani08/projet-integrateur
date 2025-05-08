import React, { useEffect, useState } from 'react';
import {
  toggleActuator,
  addActuator,
  updateActuator,
  deleteActuator,
  subscribeToActuators
} from '../../services/api';

import { Table, Button, Card, Form, Row, Col } from 'react-bootstrap';
import DashboardCard from '../../components/DashboardCard';



const ActuatorList = () => {
  const [actuators, setActuators] = useState([]);
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToActuators((data) => {
      setActuators(data);
    });

    return () => unsubscribe(); // Nettoyage de l'écouteur Firebase
  }, []);

  const handleToggle = async (id) => {
    await toggleActuator(id);
    // Pas besoin de refetch, car Firebase mettra automatiquement à jour
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !type) return;

    const actuatorData = { name, type };

    if (editId) {
      await updateActuator(editId, actuatorData);
    } else {
      await addActuator(actuatorData);
    }

    setName('');
    setType('');
    setEditId(null);
  };

  const handleEdit = (actuator) => {
    setName(actuator.name);
    setType(actuator.type);
    setEditId(actuator.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer cet actionneur ?')) {
      await deleteActuator(id);
    }
  };

  return (
    <>
      <Card className="mb-4 shadow">
        <Card.Header className="bg-success text-white">
          {editId ? 'Modifier un Actionneur' : 'Ajouter un Actionneur'}
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={5}>
                <Form.Control
                  placeholder="Nom"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Col>
              <Col md={5}>
                <Form.Control
                  placeholder="Type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                />
              </Col>
              <Col md={2}>
                <Button type="submit" variant={editId ? 'warning' : 'primary'}>
                  {editId ? 'Mettre à jour' : 'Ajouter'}
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      <Card className="mb-4 shadow">
        <Card.Header className="bg-primary text-white">Liste des Actionneurs</Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Zone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {actuators.map((actuator) => (
                <tr key={actuator.id}>
                  <td>{actuator.name}</td>
                  <td>{actuator.type}</td>
                  <td>{actuator.status ? 'Actif' : 'Inactif'}</td>
                  <td>{actuator.zone || 'N/A'}</td>
                  <td>
                    <Button
                      size="sm"
                      variant={actuator.status ? 'danger' : 'success'}
                      className="me-1"
                      onClick={() => handleToggle(actuator.id)}
                    >
                      {actuator.status ? 'Désactiver' : 'Activer'}
                    </Button>
                    <Button
                      size="sm"
                      variant="warning"
                      className="me-1"
                      onClick={() => handleEdit(actuator)}
                    >
                      Modifier
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDelete(actuator.id)}
                    >
                      Supprimer
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </>
  );
};

export default ActuatorList;
