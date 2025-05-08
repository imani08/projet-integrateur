import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { toggleActuator } from '../../services/api';

const ActuatorControl = ({ actuator }) => {
  const handleToggle = async () => {
    await toggleActuator(actuator.id);
    // Tu peux ici rafraîchir l'état ou déclencher une mise à jour si nécessaire
  };

  return (
    <Card className="mb-3 shadow">
      <Card.Body>
        <Card.Title>{actuator.name}</Card.Title>
        <Card.Text>
          Statut :{' '}
          <Badge bg={actuator.status ? 'success' : 'secondary'}>
            {actuator.status ? 'Actif' : 'Inactif'}
          </Badge>
        </Card.Text>
        <Button
          variant={actuator.status ? 'danger' : 'primary'}
          onClick={handleToggle}
        >
          {actuator.status ? 'Désactiver' : 'Activer'}
        </Button>
      </Card.Body>
    </Card>
  );
};

export default ActuatorControl;

