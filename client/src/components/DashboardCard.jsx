import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartBar,
  faBell,
  faCogs,
  faUser,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';

// Dictionnaire des icônes autorisées
const iconMap = {
  chart: faChartBar,
  alert: faBell,
  settings: faCogs,
  user: faUser,
  warning: faExclamationTriangle,
};

const DashboardCard = ({ title, value, icon }) => {
  const selectedIcon = iconMap[icon] || faChartBar;

  return (
    <Card className="mb-3 shadow-sm">
      <Card.Body>
        <Row className="align-items-center">
          <Col xs="auto">
            <FontAwesomeIcon icon={selectedIcon} size="2x" className="text-primary" />
          </Col>
          <Col>
            <h5 className="mb-0">{title}</h5>
            <p className="mb-0 text-muted">{value}</p>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default DashboardCard;
