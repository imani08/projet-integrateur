import React, { useState, useEffect } from 'react';
import { updateUserProfile } from '../../services/api';
import { auth } from '../../services/firebase';
import { Container, Row, Col, Form, Button, Alert, Card } from 'react-bootstrap';

const UserSettings = () => {
  const [userData, setUserData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (auth.currentUser) {
      setUserData(prev => ({
        ...prev,
        displayName: auth.currentUser.displayName || '',
        email: auth.currentUser.email || ''
      }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (userData.password && userData.password !== userData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      await updateUserProfile({
        displayName: userData.displayName,
        email: userData.email,
        password: userData.password || undefined
      });
      setSuccess('Profil mis à jour avec succès');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Container className="user-settings">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card>
            <Card.Body>
              <Card.Title>Paramètres du Compte</Card.Title>
              
              {success && <Alert variant="success">{success}</Alert>}
              {error && <Alert variant="danger">{error}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group controlId="displayName">
                  <Form.Label>Nom d'affichage</Form.Label>
                  <Form.Control
                    type="text"
                    name="displayName"
                    value={userData.displayName}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Form.Group controlId="email">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={userData.email}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Form.Group controlId="password">
                  <Form.Label>Nouveau mot de passe</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={userData.password}
                    onChange={handleChange}
                    placeholder="Laisser vide pour ne pas changer"
                  />
                </Form.Group>

                <Form.Group controlId="confirmPassword">
                  <Form.Label>Confirmer le mot de passe</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={userData.confirmPassword}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Button variant="primary" type="submit" className="mt-3">
                  Mettre à jour
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default UserSettings;
