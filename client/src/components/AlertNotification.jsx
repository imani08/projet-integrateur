import React from 'react';
import { Alert, Row, Col } from 'react-bootstrap';

const AlertNotification = ({ alert }) => {
  const { severity, title, message, timestamp } = alert;

  // Correspondance gravité → style Bootstrap
  const variantMap = {
    info: 'info',
    warning: 'warning',
    error: 'danger',
    success: 'success',
  };

  const variant = variantMap[severity] || 'secondary';

  return (
    <Alert variant={variant} className="mb-3 shadow-sm">
      <Row className="align-items-center">
        <Col>
          <h5 className="mb-1">{title}</h5>
        </Col>
        <Col xs="auto">
          <small className="text-muted">
            {new Date(timestamp).toLocaleTimeString()}
          </small>
        </Col>
      </Row>
      <p className="mb-0">{message}</p>
    </Alert>
  );
};

export default AlertNotification;
