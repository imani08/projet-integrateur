// src/pages/About.jsx
import React from 'react';
import { Container, Row, Col, Card, Image } from 'react-bootstrap';
import {
  FaSeedling,
  FaLightbulb,
  FaHandshake,
  FaUsers,
} from 'react-icons/fa';

const teamMembers = [
    {
      name: "Imani kalumuna",
      role: "Développeur Full-Stack",
      image: "/images/imani.jpg" // remplace par ton chemin réel
    },
    {
      name: "Sarah Kimona",
      role: "Ingénieure IoT",
      image: "/images/imani.jpg"
    },
    {
      name: "Paul Nsimba",
      role: "Chef de projet",
      image: "/images/imani.jpg"
    },
    {
        name: "Paul Nsimba",
        role: "Chef de projet",
        image: "/images/imani.jpg"
      }
  ];

const About = () => {
  return (
    <Container className="py-5">
      {/* Introduction */}
      <Row className="text-center mb-5">
        <Col>
          <h1 className="fw-bold text-success mb-3">
            <FaSeedling className="me-2" />
            À propos de nous
          </h1>
          <p className="text-muted fs-5 mx-auto" style={{ maxWidth: '800px' }}>
            Nous sommes une équipe passionnée par la technologie et l'agriculture durable. Notre mission est de connecter les agriculteurs aux outils de demain grâce à des solutions intelligentes et accessibles.
          </p>
        </Col>
      </Row>

      {/* Valeurs / Mission */}
      <Row className="g-4 mb-5">
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100 text-center">
            <Card.Body>
              <FaLightbulb className="fs-2 text-warning mb-3" />
              <Card.Title>Innovation</Card.Title>
              <Card.Text>
                Nous utilisons des technologies modernes pour améliorer l'efficacité agricole.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100 text-center">
            <Card.Body>
              <FaHandshake className="fs-2 text-primary mb-3" />
              <Card.Title>Collaboration</Card.Title>
              <Card.Text>
                Agriculteurs, ingénieurs et développeurs travaillent main dans la main.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100 text-center">
            <Card.Body>
              <FaSeedling className="fs-2 text-success mb-3" />
              <Card.Title>Durabilité</Card.Title>
              <Card.Text>
                Un avenir agricole plus vert et plus responsable pour tous.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Équipe */}
      <Row className="text-center mb-4">
        <Col>
        <h2 className="fw-bold mb-3 d-flex justify-content-center align-items-center gap-2">
            <FaUsers className="text-secondary" /> Notre équipe
          </h2>
          <p className="text-muted">Découvrez les visages derrière le projet.</p>
        </Col>
      </Row>

      <Row className="g-4">
        {teamMembers.map((member, index) => (
          <Col key={index} xs={12} sm={6} md={3}>
            <Card className="text-center border-0 shadow-sm h-100">
              <Card.Body>
                <Image
                  src={member.image}
                  roundedCircle
                  fluid
                  className="mb-3"
                  style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                />
                <Card.Title className="mb-1">{member.name}</Card.Title>
                <Card.Text className="text-muted small">{member.role}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default About;
