import React, { useEffect, useState } from 'react';
import DashboardCard from '../components/DashboardCard';
import { getSensorData, getActuators } from '../services/api';
import { Container, Row, Col, Spinner, Tabs, Tab, Alert } from 'react-bootstrap';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

// Couleurs pour les graphiques
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Fonction pour normaliser le statut des actionneurs
const normalizeStatus = (status) => {
  if (typeof status === 'string') return status.toLowerCase();
  if (typeof status === 'boolean') return status ? 'on' : 'off';
  if (typeof status === 'number') return status > 0 ? 'on' : 'off';
  return 'unknown';
};

const Dashboard = () => {
  const [sensorData, setSensorData] = useState({
    temperature: 0,
    humidity: 0,
    co2: 0,
    light: 0,
    waterLevel: 0
  });
  const [historicalData, setHistoricalData] = useState([]);
  const [actuators, setActuators] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getSensorData();
        setSensorData(data);

        // Simuler des données historiques
        const now = new Date();
        const newHistoricalData = [
          { 
            time: new Date(now - 30000).toLocaleTimeString(),
            temperature: data.temperature - Math.random() * 2,
            humidity: data.humidity - Math.random() * 5,
            co2: data.co2 - Math.random() * 50,
            light: data.light - Math.random() * 100,
            waterLevel: data.waterLevel - Math.random() * 3
          },
          { 
            time: new Date(now - 20000).toLocaleTimeString(),
            temperature: data.temperature - Math.random(),
            humidity: data.humidity - Math.random() * 3,
            co2: data.co2 - Math.random() * 30,
            light: data.light - Math.random() * 50,
            waterLevel: data.waterLevel - Math.random() * 2
          },
          { 
            time: new Date(now - 10000).toLocaleTimeString(),
            temperature: data.temperature,
            humidity: data.humidity,
            co2: data.co2,
            light: data.light,
            waterLevel: data.waterLevel
          }
        ];
        setHistoricalData(newHistoricalData);

        const actuatorData = await getActuators();
        setActuators(actuatorData);
        setError(null);
      } catch (error) {
        console.error("Erreur de récupération des données:", error);
        setError("Impossible de charger les données. Veuillez réessayer.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Préparer les données pour les graphiques
  const sensorDataForPie = [
    { name: 'Température', value: sensorData.temperature },
    { name: 'Humidité', value: sensorData.humidity },
    { name: 'CO₂', value: sensorData.co2 / 100 },
    { name: 'Luminosité', value: sensorData.light / 100 },
    { name: 'Niveau eau', value: sensorData.waterLevel }
  ];

  // Préparation des données des actionneurs avec gestion d'erreur
  const actuatorStatusData = actuators.reduce((acc, actuator) => {
    try {
      const status = normalizeStatus(actuator.status);
      acc[status] = (acc[status] || 0) + 1;
    } catch (e) {
      console.warn('Erreur de normalisation du statut:', actuator.status, e);
      acc.unknown = (acc.unknown || 0) + 1;
    }
    return acc;
  }, {});

  const actuatorChartData = Object.entries(actuatorStatusData).map(([name, value]) => ({
    name: name.toUpperCase(),
    value
  }));

  // Données de répartition par zone
  const zoneDistributionData = Object.entries(
    actuators.reduce((acc, actuator) => {
      const zone = actuator.zone || 'Non spécifiée';
      acc[zone] = (acc[zone] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  if (isLoading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p>Chargement des données en cours...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="dashboard" fluid>
      <h1 className="text-center mb-4">Tableau de Bord Intelligent</h1>
      
      <Tabs defaultActiveKey="overview" className="mb-4">
        <Tab eventKey="overview" title="Vue d'ensemble">
          {/* Section Statistiques en Temps Réel */}
          <Row className="mb-4">
            <Col xs={12}>
              <h2 className="mb-3">Statistiques en Temps Réel</h2>
            </Col>
            {Object.entries(sensorData).map(([key, value], index) => (
              <Col xs={12} md={6} lg={4} className="mb-4" key={key}>
                <DashboardCard 
                  title={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                  value={key === 'temperature' ? `${value}°C` : 
                         key === 'co2' ? `${value} ppm` : 
                         key === 'light' ? `${value} lux` : `${value}%`}
                  icon={['temperature', 'humidity', 'co2', 'light', 'waterLevel'][index]}
                  color={COLORS[index % COLORS.length]}
                />
              </Col>
            ))}
          </Row>

          {/* Graphique des Données Historiques */}
          <Row className="mb-4">
            <Col xs={12}>
              <h2 className="mb-3">Évolution des Capteurs</h2>
              <div style={{ height: '400px', background: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={historicalData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="temperature" stroke="#FF8042" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="humidity" stroke="#0088FE" />
                    <Line type="monotone" dataKey="co2" stroke="#00C49F" />
                    <Line type="monotone" dataKey="light" stroke="#FFBB28" />
                    <Line type="monotone" dataKey="waterLevel" stroke="#8884D8" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="sensors" title="Analyse des Capteurs">
          <Row className="mb-4">
            <Col md={6} className="mb-4">
              <h3 className="text-center mb-3">Répartition des Mesures</h3>
              <div style={{ height: '400px', background: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sensorDataForPie}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {sensorDataForPie.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Col>

            <Col md={6} className="mb-4">
              <h3 className="text-center mb-3">Valeurs Actuelles</h3>
              <div style={{ height: '400px', background: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[sensorData]}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="temperature" fill="#FF8042" name="Température (°C)" />
                    <Bar dataKey="humidity" fill="#0088FE" name="Humidité (%)" />
                    <Bar dataKey="co2" fill="#00C49F" name="CO₂ (ppm)" />
                    <Bar dataKey="light" fill="#FFBB28" name="Luminosité (lux)" />
                    <Bar dataKey="waterLevel" fill="#8884D8" name="Niveau d'eau (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="actuators" title="Gestion des Actionneurs">
          <Row className="mb-4">
            <Col xs={12}>
              <h2 className="mb-3">Statut des Actionneurs</h2>
              {actuators.length === 0 ? (
                <Alert variant="info">Aucun actionneur disponible</Alert>
              ) : (
                <Row>
                  <Col md={6} className="mb-4">
                    <div style={{ height: '300px', background: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={actuatorChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {actuatorChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Col>

                  <Col md={6} className="mb-4">
                    <div style={{ height: '300px', background: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                      <h4 className="text-center mb-3">Répartition par Zone</h4>
                      <ResponsiveContainer width="100%" height="80%">
                        <BarChart
                          data={zoneDistributionData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#8884D8" name="Nombre d'actionneurs" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Col>
                </Row>
              )}
            </Col>
          </Row>

          <Row>
  {actuators.map((actuator) => {
    const status = normalizeStatus(actuator.status);
    return (
      <Col xs={12} md={6} lg={4} className="mb-4" key={actuator.id}>
        <DashboardCard 
          title={actuator.name} 
          value={`Status: ${status.toUpperCase()}`} 
          icon="plug"
          color={status === 'on' ? '#00C49F' : '#FF8042'}
        />
        <div className="text-center p-2" style={{ background: '#f8f9fa', borderRadius: '8px' }}>
          <p style={{ color: 'black' }}><strong>Zone:</strong> {actuator.zone || 'Non spécifiée'}</p>
          <p style={{ color: 'black' }}><strong>Type:</strong> {actuator.type || 'Générique'}</p>
        </div>
      </Col>
    );
  })}
</Row>

        </Tab>
      </Tabs>
    </Container>
  );
};

export default Dashboard;