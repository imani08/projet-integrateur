import React, { useEffect, useState } from 'react';
import DashboardCard from '../components/DashboardCard';
import { getSensorData, getActuators, getLogs  } from '../services/api';
import { Container, Row, Col, Spinner, Tabs, Tab, Alert } from 'react-bootstrap';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import * as XLSX from 'xlsx';

// Couleurs pour les graphiques
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const SENSOR_UNITS = {
  temperature: "°C",
  humidity: "%",
  waterLevel: "cm",
  gas: "ppm",
  pump: "",
  light: "lx"
};

const SENSOR_THRESHOLDS = {
  temperature: { low: 18, high: 30 },
  humidity: { low: 30, high: 70 },
  waterLevel: { low: 20, high: 80 },
  gas: { low: 50, high: 150 },
  pump: { low: 0, high: 1 },
  light: { low: 200, high: 1000 }
};

const getValueColor = (sensor, value) => {
  const th = SENSOR_THRESHOLDS[sensor];
  if (!th) return "#8884D8";
  if (value < th.low) return "#FF6B6B";      // trop bas
  if (value > th.high) return "#FFD93D";     // trop haut
  return "#4D96FF";                          // normal
};




// Normalisation du statut des actionneurs
const normalizeStatus = (status) => {
  if (typeof status === 'string') return status.toLowerCase();
  if (typeof status === 'boolean') return status ? 'on' : 'off';
  if (typeof status === 'number') return status > 0 ? 'on' : 'off';
  return 'unknown';
};

// Couleur graphique historique
const _getLineColor = (sensor, value) => {
  switch (sensor) {
    case 'temperature':
      if (value < 18) return '#0088FE';
      if (value > 30) return '#FF8042';
      return '#00C49F';
    case 'humidity':
      if (value < 30) return '#FF8042';
      if (value > 70) return '#0088FE';
      return '#00C49F';
    case 'co2':
      if (value > 800) return '#FF8042';
      return '#00C49F';
    case 'light':
      if (value < 200) return '#FF8042';
      return '#00C49F';
    case 'waterLevel':
      if (value < 20) return '#FF8042';
      return '#00C49F';
    default:
      return '#8884D8';
  }
};


const Dashboard = () => {
  const [sensorData, setSensorData] = useState({
    temperature: 0,
    humidity: 0,
    co2: 0,
    light: 0,
    waterLevel: 0
  });
  const [historicalData, _setHistoricalData] = useState([]);
  const [actuators, setActuators] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [_logs, _setLogs] = useState([]); // État pour les logs
  const [sensorHistory, setSensorHistory] = useState([]);
 
  
  

  // États pour sélection capteur et historique
  const [_selectedSensor, setSelectedSensor] = useState('temperature');


useEffect(() => {
  const fetchData = async () => {
    try {
      console.log("=== Début fetchData ===");

      // 1️⃣ Données capteurs
      const data = await getSensorData();
      console.log("sensorData récupéré:", data);
      setSensorData(data);

      // 2️⃣ Logs depuis le backend
      const logData = await getLogs(1000); // récupère un grand nombre pour être sûr
      console.log("logData récupéré:", logData);

      const logsArray = Array.isArray(logData.logs) ? logData.logs : [];

      // Conversion timestamp Firestore -> JS Date
      const logsWithDate = logsArray.map(log => ({
        ...log,
        timestamp: log.timestamp?._seconds
          ? new Date(log.timestamp._seconds * 1000 + Math.floor(log.timestamp._nanoseconds / 1e6))
          : new Date(log.timestamp)
      }));

      // Pivot et sélection des 5 logs les plus récents par capteur
      const logsBySensor = {};
      logsWithDate.forEach(log => {
        if (!logsBySensor[log.name]) logsBySensor[log.name] = [];
        logsBySensor[log.name].push({
          timestamp: log.timestamp,
          value: log.value,
          unit: log.unit || ''
        });
      });

      const pivotedHistory = Object.entries(logsBySensor).map(([sensor, entries]) => ({
        sensor,
        entries: entries
          .sort((a, b) => b.timestamp - a.timestamp) // du plus récent au plus ancien
          .slice(0, 5) // ne garder que 5 logs par capteur
      }));

      _setLogs(logsWithDate);           // tableau complet si besoin
      setSensorHistory(pivotedHistory); // pivoté par capteur pour affichage
      console.log("pivotedHistory:", pivotedHistory);

      // 3️⃣ Actionneurs
      const actuatorData = await getActuators();
      console.log("actuatorData:", actuatorData);
      setActuators(actuatorData);

    } catch (error) {
      console.error("Erreur de récupération des données:", error);
      setError("Impossible de charger les données. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
      console.log("=== Fin fetchData ===");
    }
  };

  fetchData();
  const interval = setInterval(fetchData, 5000);
  return () => clearInterval(interval);
}, []);



 // on n'écoute que le montage, plus simple pour pivoté



// aucun filtre ni dépendance, juste chargement initial + interval

// on écoute aussi filterPeriod


// (Suppression du code utilisant logsArray hors de useEffect car logsArray n'est pas défini ici)





  // Changement de capteur
  const _handleSensorChange = (e) => {
    const sensor = e.target.value;
    setSelectedSensor(sensor);
    setSensorHistory(historicalData.map(item => ({ time: item.time, value: item[sensor] })));
  };

  // Export Excel
const exportToExcel = () => {
  const wb = XLSX.utils.book_new();

  sensorHistory.forEach(({ sensor, entries }) => {
    // Préparer les données exactement comme affiché
    const data = [
      ["Capteur :", sensor],
      ["Heure", "Valeur"]
    ];

    entries.forEach(e => {
      data.push([e.timestamp.toLocaleString(), e.value + (e.unit || '')]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
      { wch: 25 }, // Heure
      { wch: 15 }  // Valeur
    ];

    XLSX.utils.book_append_sheet(wb, ws, sensor.substring(0, 31)); // nom max 31 caractères
  });

  XLSX.writeFile(wb, `historique_capteurs.xlsx`);
};


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
    {/* --- TITRE PRINCIPAL --- */}
    <h1 className="text-center mb-4">Tableau de Bord</h1>

    <Tabs defaultActiveKey="overview" className="mb-4">

      {/* --- VUE D'ENSEMBLE --- */}
      <Tab eventKey="overview" title="Vue d'ensemble">
        <Row className="mb-4">
          <Col xs={12}>
            <h2 className="mb-3">Statistiques en Temps Réel</h2>
          </Col>

          {Object.entries(sensorData).map(([key, value], index) => (
            <Col xs={12} md={6} lg={4} className="mb-4" key={key}>
              <DashboardCard 
                title={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                value={
                  key === 'temperature' ? `${value}°C` : 
                  key === 'co2' ? `${value} ppm` : 
                  key === 'light' ? `${value} lux` : `${value}%`
                }
                icon={['temperature', 'humidity', 'co2', 'light', 'waterLevel'][index]}
                color={COLORS[index % COLORS.length]}
              />
            </Col>
          ))}
        </Row>
      </Tab>

      {/* --- ANALYSE CAPTEURS --- */}
<Tab eventKey="sensors" title="Analyse des Capteurs">
  <Row className="mb-4">
    <Col xs={12} className="mb-3">
      <h3 className="text-center mb-3">Historique des Capteurs</h3>
      <div className="d-flex justify-content-center">
        <button className="btn btn-success ms-3" onClick={exportToExcel}>
          Exporter
        </button>
      </div>
    </Col>

    {sensorHistory.map(({ sensor, entries }) => (
      <Col xs={12} md={6} lg={4} className="mb-4" key={sensor}>
        <div style={{
          background: '#1E1E2F',
          borderRadius: '12px',
          padding: '15px',
          boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
        }}>
          <h5 style={{ color: '#00C49F', marginBottom: '15px', textAlign: 'center' }}>
            {sensor.toUpperCase()}
          </h5>

          {/* Tableau mini */}
          <table className="table table-borderless" style={{ color: '#fff', marginBottom: '15px' }}>
            <thead>
              <tr>
                <th>Heure</th>
                <th>Valeur</th>
              </tr>
            </thead>
            <tbody>
              {entries
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((entry, idx) => (
                  <tr key={idx} style={{ background: idx % 2 === 0 ? '#2C2C3E' : '#252536' }}>
                    <td>{entry.timestamp.toLocaleTimeString()}</td>
                    <td>
                      <span style={{
                        background: getValueColor(sensor, entry.value),
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        color: '#fff',
                        display: 'inline-block',
                        minWidth: '50px',
                        textAlign: 'center'
                      }}>
                        {entry.value} {entry.unit || ''}
                      </span>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>

          {/* Mini graphique */}
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={entries.slice().sort((a,b)=>a.timestamp-b.timestamp)}>
              <XAxis dataKey="timestamp" tickFormatter={(time) => new Date(time).toLocaleTimeString()} />
              <YAxis />
              <Tooltip labelFormatter={(time) => new Date(time).toLocaleString()} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#00C49F"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Col>
    ))}
  </Row>
</Tab>



      {/* --- GESTION ACTIONNEURS --- */}
      <Tab eventKey="actuators" title="Gestion des Actionneurs">
        <Row className="mb-4">
          <Col xs={12}>
            <h2 className="mb-3">Statut des Actionneurs</h2>
            {actuators.length === 0 ? (
              <Alert variant="info">Aucun actionneur disponible</Alert>
            ) : (
              <Row>
                {/* Graphiques Actionneurs */}
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
                      <BarChart data={zoneDistributionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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

        {/* Liste Actionneurs */}
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
