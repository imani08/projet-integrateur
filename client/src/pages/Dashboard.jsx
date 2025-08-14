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



// Normalisation du statut des actionneurs
const normalizeStatus = (status) => {
  if (typeof status === 'string') return status.toLowerCase();
  if (typeof status === 'boolean') return status ? 'on' : 'off';
  if (typeof status === 'number') return status > 0 ? 'on' : 'off';
  return 'unknown';
};

// Couleur graphique historique
const getLineColor = (sensor, value) => {
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
  const [historicalData, setHistoricalData] = useState([]);
  const [actuators, setActuators] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [_logs, _setLogs] = useState([]); // État pour les logs
  const [sensorHistory, setSensorHistory] = useState([]);
  const [filterPeriod, setFilterPeriod] = useState('day');
  
  

  // États pour sélection capteur et historique
  const [selectedSensor, setSelectedSensor] = useState('temperature');


useEffect(() => {
  const fetchData = async () => {
    try {
      // Récupération des données des capteurs
      const data = await getSensorData();
      setSensorData(data);

      // Récupération des logs depuis l'API
      const logData = await getLogs(100); // limite ajustable
      const logsArray = Array.isArray(logData) ? logData : [];

      // Filtrer par capteur sélectionné
      let filteredLogs = logsArray.filter(log => log.sensor === selectedSensor);

      // Filtrer selon la période choisie
      const now = new Date();
      filteredLogs = filteredLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        if (filterPeriod === 'hour') return logDate >= new Date(now.getTime() - 60 * 60 * 1000);
        if (filterPeriod === 'day') return logDate >= new Date(now.getTime() - 24 * 60 * 60 * 1000);
        if (filterPeriod === 'week') return logDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (filterPeriod === 'month') return logDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return true;
      });

      // Transformer les logs pour le graphique et le tableau
      const historicalFromLogs = filteredLogs.map(log => ({
        timestamp: log.timestamp, // <- vrai timestamp
        time: new Date(log.timestamp).toLocaleTimeString(),
        [selectedSensor]: log.value
      }));

      // Fusionner avec les données simulées récentes
      const newHistoricalData = [
        { 
          timestamp: new Date(now - 30000).toISOString(),
          time: new Date(now - 30000).toLocaleTimeString(),
          temperature: data.temperature - Math.random() * 2,
          humidity: data.humidity - Math.random() * 5,
          co2: data.co2 - Math.random() * 50,
          light: data.light - Math.random() * 100,
          waterLevel: data.waterLevel - Math.random() * 3
        },
        { 
          timestamp: new Date(now - 20000).toISOString(),
          time: new Date(now - 20000).toLocaleTimeString(),
          temperature: data.temperature - Math.random(),
          humidity: data.humidity - Math.random() * 3,
          co2: data.co2 - Math.random() * 30,
          light: data.light - Math.random() * 50,
          waterLevel: data.waterLevel - Math.random() * 2
        },
        { 
          timestamp: new Date(now - 10000).toISOString(),
          time: new Date(now - 10000).toLocaleTimeString(),
          temperature: data.temperature,
          humidity: data.humidity,
          co2: data.co2,
          light: data.light,
          waterLevel: data.waterLevel
        }
      ];

      const mergedHistoricalData = [...newHistoricalData, ...historicalFromLogs];
      setHistoricalData(mergedHistoricalData);

      // Mettre à jour l'historique du capteur sélectionné
      setSensorHistory(
        mergedHistoricalData.map(item => ({
          timestamp: item.timestamp,
          time: item.time,
          value: item[selectedSensor] ?? 0
        }))
      );

      // Récupération des actionneurs
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
}, [selectedSensor, filterPeriod]);



  // Changement de capteur
  const handleSensorChange = (e) => {
    const sensor = e.target.value;
    setSelectedSensor(sensor);
    setSensorHistory(historicalData.map(item => ({ time: item.time, value: item[sensor] })));
  };

  // Export Excel
  const exportToExcel = () => {
  const now = new Date();
  let startDate;

  // Calculer la date de début selon le filtre
  switch (filterPeriod) {
    case 'hour':
      startDate = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case 'day':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(0); // Tout depuis le début
  }

  // Fonction utilitaire pour formater date et heure
  const formatDateTime = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  const formattedStart = formatDateTime(startDate);
  const formattedEnd = formatDateTime(now);

  // Préparer l'en-tête
  const header = [
    [`Capteur : ${selectedSensor.charAt(0).toUpperCase() + selectedSensor.slice(1)}`],
    [`Période : ${formattedStart} → ${formattedEnd}`],
    [], // Ligne vide
    ["Heure", "Valeur"] // En-têtes de colonnes
  ];

  // Préparer les données
  const dataRows = sensorHistory.map(item => [item.time, item.value]);

  // Fusionner en-tête + données
  const worksheetData = [...header, ...dataRows];

  // Créer la feuille Excel
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);

  // Définir largeur des colonnes
  ws['!cols'] = [
    { wch: 25 }, // Largeur pour Heure
    { wch: 15 }  // Largeur pour Valeur
  ];

  // Créer le classeur et ajouter la feuille
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Historique');

  // Exporter
  XLSX.writeFile(wb, `historique_${selectedSensor}_${filterPeriod}.xlsx`);
};



  // Préparation données graphiques
  

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
    <h1 className="text-center mb-4">Tableau de Bord Intelligent</h1>

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
          {/* Sélection du Capteur et Export Excel */}
          <Col xs={12} className="mb-3">
            <h3 className="text-center mb-3">Sélection du Capteur</h3>
            <div className="d-flex justify-content-center">
              <select 
                className="form-select w-50"
                value={selectedSensor}
                onChange={handleSensorChange}
              >
                {Object.keys(sensorData).map((key) => (
                  <option key={key} value={key}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </option>
                ))}
              </select>
              <button className="btn btn-success ms-3" onClick={exportToExcel}>
                Export Excel
              </button>
            </div>
          </Col>

          {/* Filtres par période stylisés */}
<Col xs={12} className="mb-4">
  <div className="d-flex justify-content-center gap-3 flex-wrap">
    {['heure', 'jour', 'semaine', 'mois'].map((period) => {
      const isActive = filterPeriod === period;
      return (
        <button
          key={period}
          onClick={() => setFilterPeriod(period)}
          className={`btn btn-lg fw-bold ${
            isActive ? 'btn-primary shadow' : 'btn-outline-primary'
          }`}
          style={{
            borderRadius: '50px',
            minWidth: '100px',
            transition: 'all 0.3s',
          }}
        >
          {period.charAt(0).toUpperCase() + period.slice(1)}
        </button>
      );
    })}
  </div>
</Col>


  

          {/* Graphique Historique */}
<Col xs={12} className="mb-4">
  <h3 className="text-center mb-3">Évolution Historique</h3>
  <div style={{ height: '400px', background: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart 
        data={historicalData.filter(item => {
          const logDate = new Date(item.timestamp); // utiliser directement le timestamp
          const now = new Date();
          if(filterPeriod === 'heure') return logDate >= new Date(now.getTime() - 60*60*1000);
          if(filterPeriod === 'jour') return logDate >= new Date(now.getTime() - 24*60*60*1000);
          if(filterPeriod === 'semaine') return logDate >= new Date(now.getTime() - 7*24*60*60*1000);
          if(filterPeriod === 'mois') return logDate >= new Date(now.getTime() - 30*24*60*60*1000);
          return true;
        }).map(item => ({ time: new Date(item.timestamp).toLocaleTimeString(), value: item[selectedSensor] || 0 }))}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="value"
          stroke={getLineColor(selectedSensor, historicalData[historicalData.length-1]?.[selectedSensor])}
          isAnimationActive={false}
          dot={{ r: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
</Col>

{/* Tableau Historique */}
<Col xs={12} className="mb-4">
  <h3 className="text-center mb-3">
    Évolution du capteur : {selectedSensor.charAt(0).toUpperCase() + selectedSensor.slice(1)}
  </h3>
  <div
    style={{
      background: '#1E1E2F',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
      overflowX: 'auto'
    }}
  >
    <table className="table table-borderless" style={{ color: '#fff', minWidth: '300px' }}>
      <thead>
        <tr>
          <th style={{ borderBottom: '2px solid #555' }}>Heure</th>
          <th style={{ borderBottom: '2px solid #555' }}>Valeur</th>
        </tr>
      </thead>
      <tbody>
        {historicalData
          .filter(item => {
            const logDate = new Date(item.timestamp);
            const now = new Date();
            if(filterPeriod === 'heure') return logDate >= new Date(now.getTime() - 60*60*1000);
            if(filterPeriod === 'jour') return logDate >= new Date(now.getTime() - 24*60*60*1000);
            if(filterPeriod === 'semaine') return logDate >= new Date(now.getTime() - 7*24*60*60*1000);
            if(filterPeriod === 'mois') return logDate >= new Date(now.getTime() - 30*24*60*60*1000);
            return true;
          })
          .map((item, index) => (
            <tr
              key={index}
              style={{
                background: index % 2 === 0 ? '#2C2C3E' : '#252536',
                transition: '0.3s',
                cursor: 'default'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#44445A'}
              onMouseLeave={e => e.currentTarget.style.background = index % 2 === 0 ? '#2C2C3E' : '#252536'}
            >
              <td>{new Date(item.timestamp).toLocaleTimeString()}</td>
              <td>
                <span
                  style={{
                    background: selectedSensor === 'temperature' ? '#FF6B6B' :
                               selectedSensor === 'humidity' ? '#4D96FF' :
                               selectedSensor === 'co2' ? '#00C49F' :
                               selectedSensor === 'light' ? '#FFD93D' :
                               '#A093FF',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    color: '#fff',
                    display: 'inline-block',
                    minWidth: '50px',
                    textAlign: 'center'
                  }}
                >
                  {item[selectedSensor]}
                </span>
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  </div>
</Col>

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
