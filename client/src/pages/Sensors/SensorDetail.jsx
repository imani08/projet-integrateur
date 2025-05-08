import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSensorHistory } from '../../services/api';
import { Container, Row, Col, Card, Table } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';

const SensorDetail = () => {
  const { id } = useParams();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      const data = await getSensorHistory(id);
      setHistory(data);
    };
    fetchHistory();
  }, [id]);

  const chartData = {
    labels: history.map(entry => new Date(entry.timestamp).toLocaleString()),
    datasets: [
      {
        label: 'Valeur du Capteur',
        data: history.map(entry => entry.value),
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1,
        fill: false
      }
    ]
  };

  return (
    <Container className="sensor-detail">
      <Row className="justify-content-center">
        <Col md={8} sm={12}>
          <Card>
            <Card.Body>
              <Card.Title>Historique du Capteur</Card.Title>
              <div className="history-chart">
                {/* Graphique avec Chart.js */}
                <Line data={chartData} />
              </div>
              <div className="history-table mt-4">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Date/Heure</th>
                      <th>Valeur</th>
                      <th>Unité</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((entry) => (
                      <tr key={entry.timestamp}>
                        <td>{new Date(entry.timestamp).toLocaleString()}</td>
                        <td>{entry.value}</td>
                        <td>{entry.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SensorDetail;
