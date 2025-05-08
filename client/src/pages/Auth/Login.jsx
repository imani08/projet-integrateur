import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { Form, Button, Alert, Container, Row, Col, ProgressBar } from 'react-bootstrap';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setProgress(30); // Début de l'authentification
    
    try {
      // Étape 1: Authentification de l'utilisateur
      setProgress(60);
      await signInWithEmailAndPassword(auth, email, password);

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
    <Container className="login-container">
      <Row className="justify-content-center">
        <Col md={6} sm={12}>
          <h2 className="text-center mb-4">Connexion</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleLogin}>
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
                <div className="text-center mt-2">Connexion en cours...</div>
              </div>
            )}

            <div className="d-grid gap-2">
              <Button 
                variant="primary" 
                type="submit" 
                className="mb-3"
                disabled={isLoading}
              >
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </Button>
              
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate('/register')}
                disabled={isLoading}
              >
                Pas encore de compte ? S'inscrire
              </Button>
            </div>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;