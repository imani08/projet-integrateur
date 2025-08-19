import React, { useEffect, useState } from 'react';
import DashboardCard from '../components/DashboardCard';
import { getSensorData, getActuators, getLogs } from '../services/api';
import { Container, Row, Col, Spinner, Tabs, Tab, Alert } from 'react-bootstrap';
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import * as XLSX from 'xlsx';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const normalizeStatus = (status) => {
  if (typeof status === 'string') return status.toLowerCase();
  if (typeof status === 'boolean') return status ? 'on' : 'off';
  if (typeof status === 'number') return status > 0 ? 'on' : 'off';
  return 'unknown';
};

const sensorsKeys = ['temperature', 'humidity', 'co2', 'light', 'waterLevel'];

// helper : vérifie si un timestamp est dans la période demandée
const inPeriod = (timestampIso, period) => {
  const now = Date.now();
  const t = new Date(timestampIso).getTime();
  switch (period) {
    case 'heure': return t >= now - 60 * 60 * 1000;
    case 'jour': return t >= now - 24 * 60 * 60 * 1000;
    case 'semaine': return t >= now - 7 * 24 * 60 * 60 * 1000;
    case 'mois': return t >= now - 30 * 24 * 60 * 60 * 1000;
    default: return true;
  }
};

const Dashboard = () => {
  const [sensorData, setSensorData] = useState({
    temperature: 0, humidity: 0, co2: 0, light: 0, waterLevel: 0
  });
  // historique par capteur : { temperature: [{timestamp, time, value}, ...], humidity: [...], ... }
  const [historicalBySensor, setHistoricalBySensor] = useState({
    temperature: [], humidity: [], co2: [], light: [], waterLevel: []
  });
  const [actuators, setActuators] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedSensor, setSelectedSensor] = useState('temperature');
  const [filterPeriod, setFilterPeriod] = useState('jour'); // 'heure'|'jour'|'semaine'|'mois'

  // fetch & update real logs & sensors
useEffect(() => {
  let cancelled = false;
  const abortController = new AbortController();
  const lastTimestampsRef = { // on garde le dernier timestamp connu par capteur
    temperature: null, humidity: null, co2: null, light: null, waterLevel: null
  };
  let initialLoad = true;

  const fetchData = async () => {
    try {
      // ne remet pas isLoading à true à chaque cycle : seulement au premier
      if (initialLoad) setIsLoading(true);

      // 1) valeurs en temps réel
      const data = await getSensorData({ signal: abortController.signal }).catch(e => { throw e; });
      if (cancelled) return;
      setSensorData(prev => {
        // comparaison simple : si identique, ne pas setState
        if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
        return data;
      });

      // 2) logs
      const rawLogs = await getLogs(5000, { signal: abortController.signal }).catch(e => { throw e; });
      if (cancelled) return;
      const logsArray = Array.isArray(rawLogs) ? rawLogs : [];

      // Construire temporaire par capteur et comparer dernier timestamp
      const tempBySensor = { temperature: [], humidity: [], co2: [], light: [], waterLevel: [] };
      logsArray.forEach(log => {
        if (!log || !log.timestamp || !log.sensor) return;
        const sensor = log.sensor;
        if (!tempBySensor[sensor]) return;
        tempBySensor[sensor].push({
          timestamp: new Date(log.timestamp).toISOString(),
          time: new Date(log.timestamp).toLocaleTimeString(),
          value: log.value
        });
      });

      // Trier et décider si update nécessaire : vérifier dernier timestamp
      let shouldUpdate = false;
      Object.keys(tempBySensor).forEach(k => {
        tempBySensor[k].sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
        const last = tempBySensor[k].length ? tempBySensor[k][tempBySensor[k].length - 1].timestamp : null;
        if (last && last !== lastTimestampsRef[k]) {
          shouldUpdate = true;
          lastTimestampsRef[k] = last;
        }
      });

      if (shouldUpdate || initialLoad) {
        setHistoricalBySensor(prev => {
          // évite override si identique (double protection)
          if (!initialLoad && JSON.stringify(prev) === JSON.stringify(tempBySensor)) return prev;
          return tempBySensor;
        });
      }

      // 3) actuators (comparaison légère)
      const actuatorData = await getActuators({ signal: abortController.signal }).catch(e => { throw e; });
      if (!cancelled) {
        setActuators(prev => {
          if (JSON.stringify(prev) === JSON.stringify(actuatorData)) return prev;
          return actuatorData || [];
        });
      }

      // reset flags
      initialLoad = false;
      setError(null);
    } catch (err) {
      if (err.name === 'AbortError') {
        // requête annulée : rien à faire
        return;
      }
      console.error("Erreur récupération : ", err);
      // si 401, gérer proprement (rafraîchir token / afficher message), NE PAS reloader la page
      if (err.response && err.response.status === 401) {
        setError("Authentification expirée (401). Renouveler le token.");
        // optionnel : déclencher flow de refresh token ici
      } else {
        setError("Impossible de charger les données réelles.");
      }
    } finally {
      if (!cancelled) setIsLoading(false);
    }
  };

  fetchData();
  const interval = setInterval(fetchData, 5000);

  return () => {
    cancelled = true;
    abortController.abort();
    clearInterval(interval);
  };
}, []); // empty deps : on initialise une seule fois (polling interne s'en charge)
 // pas de dépendance sur selectedSensor pour ne pas re-créer fetch inutilement

  // quand on change de capteur, on n'a plus qu'à utiliser historicalBySensor[selectedSensor] dans l'UI
  const handleSensorChange = (e) => {
    setSelectedSensor(e.target.value);
  };

  // EXPORT Excel : exporte l'historique du capteur sélectionné (uniquement les logs réels)
  const exportToExcel = () => {
    const now = new Date();
    // calcul start selon filterPeriod
    let startDate;
    switch (filterPeriod) {
      case 'heure': startDate = new Date(now.getTime() - 60 * 60 * 1000); break;
      case 'jour': startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
      case 'semaine': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case 'mois': startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      default: startDate = new Date(0);
    }

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

    const header = [
      [`Capteur : ${selectedSensor.charAt(0).toUpperCase() + selectedSensor.slice(1)}`],
      [`Période : ${formattedStart} → ${formattedEnd}`],
      [],
      ["Heure", "Valeur"]
    ];

    const rows = (historicalBySensor[selectedSensor] || [])
      .filter(r => new Date(r.timestamp) >= startDate)
      .map(r => [r.time, r.value]);

    const worksheetData = [...header, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    ws['!cols'] = [{ wch: 25 }, { wch: 15 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Historique');
    XLSX.writeFile(wb, `historique_${selectedSensor}_${filterPeriod}.xlsx`);
  };

  // préparation des datas pour le graphique (filtrer par période)
  const graphData = (historicalBySensor[selectedSensor] || [])
    .filter(item => inPeriod(item.timestamp, filterPeriod))
    .map(item => ({ time: item.time, value: item.value }));

  // actuators chart data (inchangé)
  const actuatorStatusData = actuators.reduce((acc, actuator) => {
    try {
      const status = normalizeStatus(actuator.status);
      acc[status] = (acc[status] || 0) + 1;
    } catch {
      acc.unknown = (acc.unknown || 0) + 1;
    }
    return acc;
  }, {});
  const actuatorChartData = Object.entries(actuatorStatusData).map(([name, value]) => ({ name: name.toUpperCase(), value }));

  if (isLoading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p>Chargement des données réelles en cours...</p>
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
    <Container fluid className="dashboard">
      <h1 className="text-center mb-4">Tableau de Bord</h1>

      <Tabs defaultActiveKey="overview" className="mb-4">
        <Tab eventKey="overview" title="Vue d'ensemble">
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
        </Tab>

        <Tab eventKey="sensors" title="Analyse des Capteurs">
          <Row className="mb-4">
            <Col xs={12} className="mb-3">
              <h3 className="text-center mb-3">Sélection du Capteur</h3>
              <div className="d-flex justify-content-center">
                <select className="form-select w-50" value={selectedSensor} onChange={handleSensorChange}>
                  {sensorsKeys.map(k => (
                    <option key={k} value={k}>
                      {k.charAt(0).toUpperCase() + k.slice(1)}
                    </option>
                  ))}
                </select>
                <button className="btn btn-success ms-3" onClick={exportToExcel}>
                  Export Excel
                </button>
              </div>
            </Col>

            <Col xs={12} className="mb-4">
              <div className="d-flex justify-content-center gap-3 flex-wrap">
                {['heure', 'jour', 'semaine', 'mois'].map(period => {
                  const isActive = filterPeriod === period;
                  return (
                    <button
                      key={period}
                      onClick={() => setFilterPeriod(period)}
                      className={`btn btn-lg fw-bold ${isActive ? 'btn-primary shadow' : 'btn-outline-primary'}`}
                      style={{ borderRadius: '50px', minWidth: '100px', transition: 'all 0.3s' }}
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </button>
                  );
                })}
              </div>
            </Col>

            <Col xs={12} className="mb-4">
              <h3 className="text-center mb-3">Évolution Historique ({selectedSensor})</h3>
              <div style={{ height: '400px', background: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={graphData} margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" label={{ value: 'Temps', position: 'bottom', offset: 20, style: { textAnchor: 'middle', fontWeight: 'bold', fill: '#555' } }} />
                    <YAxis label={{ value: selectedSensor === 'temperature' ? 'Température (°C)' : selectedSensor === 'humidity' ? 'Humidité (%)' : selectedSensor === 'co2' ? 'CO₂ (ppm)' : selectedSensor === 'light' ? 'Luminosité (lx)' : 'Niveau d’eau (cm)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#555', fontWeight: 'bold' } }} />
                    <Tooltip formatter={value => [`${value}`, selectedSensor.charAt(0).toUpperCase() + selectedSensor.slice(1)]} labelFormatter={label => `Heure: ${label}`} />
                    <Line type="monotone" dataKey="value" stroke="#007BFF" isAnimationActive={false} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Col>

            <Col xs={12} className="mb-4">
              <h3 className="text-center mb-3">Tableau Historique</h3>
              <div style={{ background: '#1E1E2F', borderRadius: '12px', padding: '20px', boxShadow: '0 8px 20px rgba(0,0,0,0.2)', overflowX: 'auto' }}>
                <table className="table table-borderless" style={{ color: '#fff', minWidth: '300px' }}>
                  <thead>
                    <tr>
                      <th style={{ borderBottom: '2px solid #555' }}>Heure</th>
                      <th style={{ borderBottom: '2px solid #555' }}>Valeur</th>
                    </tr>
                  </thead>
                  <tbody>
                    { (historicalBySensor[selectedSensor] || [])
                        .filter(item => inPeriod(item.timestamp, filterPeriod))
                        .map((item, index) => (
                          <tr key={index} style={{ background: index % 2 === 0 ? '#2C2C3E' : '#252536', transition: '0.3s', cursor: 'default' }}>
                            <td>{item.time}</td>
                            <td>
                              <span style={{
                                background: selectedSensor === 'temperature' ? '#FF6B6B' :
                                          selectedSensor === 'humidity' ? '#4D96FF' :
                                          selectedSensor === 'co2' ? '#00C49F' :
                                          selectedSensor === 'light' ? '#FFD93D' : '#A093FF',
                                padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold', color: '#fff', display: 'inline-block', minWidth: '50px', textAlign: 'center'
                              }}>{item.value}</span>
                            </td>
                          </tr>
                        ))
                    }
                  </tbody>
                </table>
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
                          <Pie data={actuatorChartData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                            {actuatorChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
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
                        {/* BarChart could être ici */}
                        <PieChart>
                          <Pie data={actuatorChartData} dataKey="value" cx="50%" cy="50%" outerRadius={60} label />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Col>
                </Row>
              )}
            </Col>
          </Row>

          <Row>
            {actuators.map(actuator => {
              const status = normalizeStatus(actuator.status);
              return (
                <Col xs={12} md={6} lg={4} className="mb-4" key={actuator.id}>
                  <DashboardCard title={actuator.name} value={`Status: ${status.toUpperCase()}`} icon="plug" color={status === 'on' ? '#00C49F' : '#FF8042'} />
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
