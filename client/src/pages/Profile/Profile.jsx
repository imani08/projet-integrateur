import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../services/firebase';
import { Container, Row, Col, Card, Image } from 'react-bootstrap';

const Profile = () => {
  const [user] = useAuthState(auth);

  if (!user) return null;

  return (
    <Container className="profile">
      <Row className="justify-content-center">
        <Col md={6} sm={12}>
          <Card>
            <Card.Body>
              <Row className="align-items-center">
                <Col xs={4} md={3} className="text-center">
                  <div className="avatar">
                    {user.photoURL ? (
                      <Image src={user.photoURL} alt="Avatar" roundedCircle fluid />
                    ) : (
                      <div className="default-avatar">
                        {user.displayName?.charAt(0) || user.email?.charAt(0)}
                      </div>
                    )}
                  </div>
                </Col>
                <Col xs={8} md={9}>
                  <Card.Title>{user.displayName || 'Utilisateur'}</Card.Title>
                  <Card.Text>{user.email}</Card.Text>
                  <Card.Text>
                    Inscrit depuis: {new Date(user.metadata.creationTime).toLocaleDateString()}
                  </Card.Text>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;
