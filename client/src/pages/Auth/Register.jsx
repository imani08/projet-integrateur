import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { db } from '../../services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Form, Button, Alert, Container, Row, Col, ProgressBar } from 'react-bootstrap';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setProgress(10); // Début du processus
    
    try {
      // Étape 1: Création de l'utilisateur
      setProgress(30);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Étape 2: Récupération de l'UID
      setProgress(60);
      const uid = userCredential.user.uid;

      // Étape 3: Enregistrement dans Firestore
      setProgress(80);
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, {
        email: email,
        role: 'viewer',
        createdAt: new Date(),
      });

      setProgress(100);
      
      // Petite pause pour montrer la progression complète avant la redirection
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
      
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      setProgress(0);
    }
  };

  return (
    <Container className="register-container">
      <Row className="justify-content-center">
        <Col md={6} sm={12}>
          <h2 className="text-center mb-4">Créer un compte</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleRegister}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Entrez votre email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Mot de passe</Form.Label>
              <Form.Control
                type="password"
                placeholder="Entrez votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </Form.Group>

            {isLoading && (
              <div className="mb-3">
                <ProgressBar now={progress} label={`${progress}%`} animated />
                <div className="text-center mt-2">Création du compte en cours...</div>
              </div>
            )}

            <div className="d-grid gap-2">
              <Button 
                variant="primary" 
                type="submit" 
                className="mb-3"
                disabled={isLoading}
              >
                {isLoading ? 'Traitement...' : 'S\'inscrire'}
              </Button>
              
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate('/login')}
                disabled={isLoading}
              >
                Déjà un compte ? Se connecter
              </Button>
            </div>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;