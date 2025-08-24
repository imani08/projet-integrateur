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
  co2: "ppm",      // changé "gas" en "co2" pour correspondre à tes données
  pump: "",
  light: "lx"
};

const SENSOR_LABELS = {
  temperature: "Température",
  humidity: "Humidité",
  waterLevel: "Niveau d'eau",
  gas: "Gaz",
  co2: "CO₂",
  pump: "Pompe",
  light: "Luminosité"
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
          title={SENSOR_LABELS[key] || key}
          value={`${value} ${SENSOR_UNITS[key] || ''}`}
          icon={['température', 'humidité', 'co2', 'lumière', "Niveau d'eau"][index]}
          color={COLORS[index % COLORS.length]}
        />
      </Col>
    ))}
  </Row>

  {/* --- TEXTE STATIQUE --- */}
  <Row className="mt-4">
  <Col xs={12}>
    <div style={{ textAlign: 'center', color: '#555', fontWeight: '500', fontSize: '0.95rem' }}>
      Ce tableau de bord vous offre une vision en temps réel de vos capteurs et actionneurs. 
      Chaque donnée affichée reflète l’état actuel du système pour vous permettre de prendre des décisions éclairées et d’optimiser vos opérations en toute confiance.
    </div>
  </Col>
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
  <Row className="mb-5">
    <Col xs={12}>
      <h2 className="mb-4" style={{ fontWeight: 700, color: "#212529" }}>Statut des Actionneurs</h2>

      {actuators.length === 0 ? (
        <Alert variant="info" style={{ fontSize: "1rem", borderRadius: "12px" }}>
          Aucun actionneur disponible
        </Alert>
      ) : (
        <Row className="g-4">
          {/* PieChart Statut */}
          <Col md={6}>
            <div className="dashboard-card">
              <h5 className="text-center mb-3" style={{ fontWeight: 500, color: "#495057" }}>Répartition des Statuts</h5>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={actuatorChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent*100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {actuatorChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Col>

          {/* BarChart Zone */}
<Col md={6}>
  <div className="dashboard-card">
    <h5 className="text-center mb-3" style={{ fontWeight: 500, color: "#495057" }}>
      Répartition des actionneurs par zone
    </h5>
    <ResponsiveContainer width="100%" height={250}>
      <BarChart
        data={zoneDistributionData}
        margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: "#495057" }}
          label={{ value: "Zones", position: "insideBottom", offset: -5, fontSize: 13 }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "#495057" }}
          label={{ value: "Nombre d'actionneurs", angle: -90, position: "insideLeft", fontSize: 13 }}
        />
        <Tooltip formatter={(value) => [`${value}`, "Actionneurs"]} />
        <Bar
          dataKey="value"
          fill="#4e73df"
          radius={[6, 6, 0, 0]}
          name="Actionneurs"
        >
          {zoneDistributionData.map((entry, index) => (
            <text
              key={`label-${index}`}
              x={index * (250 / zoneDistributionData.length) + 12} // ajustement position
              y={250 - (entry.value * 5)} // ajuster selon l’échelle
              textAnchor="middle"
              fill="#000"
              fontSize={12}
            >
              {entry.value}
            </text>
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
</Col>

        </Row>
      )}
    </Col>
  </Row>

  {/* Liste Actionneurs */}
  <Row className="g-4">
    {actuators.map(actuator => {
      const status = normalizeStatus(actuator.status);
      const isOn = status === "on";

      return (
        <Col xs={12} md={6} lg={4} key={actuator.id}>
          <div className="dashboard-card hover-scale" style={{ padding: "20px", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <h5 style={{ fontWeight: 600 }}>{actuator.name}</h5>
              <span style={{
                padding: "5px 10px",
                borderRadius: "20px",
                fontWeight: 500,
                fontSize: "0.85rem",
                backgroundColor: isOn ? "#d4f7e1" : "#ffe3d3",
                color: isOn ? "#00C49F" : "#FF8042"
              }}>
                {status.toUpperCase()}
              </span>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <DashboardCard 
                title="" 
                value="" 
                icon="plug"
                color={isOn ? "#00C49F" : "#FF8042"}
                hideTitle
              />
            </div>

            <div style={{ background: "#f8f9fa", borderRadius: "12px", padding: "12px", textAlign: "center" }}>
              <p style={{ margin: 0, color: "#495057" }}><strong>Zone:</strong> {actuator.zone || "Non spécifiée"}</p>
              <p style={{ margin: 0, color: "#495057" }}><strong>Type:</strong> {actuator.type || "Générique"}</p>
            </div>
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
