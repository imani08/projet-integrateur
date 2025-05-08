import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Unauthorized from './components/Unauthorized';

// Import des pages
const Login = React.lazy(() => import('./pages/Auth/Login'));
const Register = React.lazy(() => import('./pages/Auth/Register'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const SensorList = React.lazy(() => import('./pages/Sensors/SensorList'));
const SensorDetail = React.lazy(() => import('./pages/Sensors/SensorDetail'));
const ActuatorList = React.lazy(() => import('./pages/Actuators/ActuatorList'));
const AlertList = React.lazy(() => import('./pages/Alerts/Alertlists'));
const AlertSettings = React.lazy(() => import('./pages/Alerts/AlertSettings'));
const UserSettings = React.lazy(() => import('./pages/Settings/UserSettings'));
const SystemSettings = React.lazy(() => import('./pages/Settings/SystemSettings'));
const Profile = React.lazy(() => import('./pages/Profile/Profile'));
const About = React.lazy(() => import('./pages/about'));
const AdminAssignRoles = React.lazy(() => import('./pages/AdminAssignRoles'));

// Définition des rôles
const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  TECHNICIAN: 'technician',
  VIEWER: 'viewer'
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <div className="container">
          <React.Suspense fallback={<div className="text-center mt-5">Chargement...</div>}>
            <Routes>
              {/* Routes publiques */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/about" element =  {<About />} />
              <Route path= "/alerts" element = {<AlertList />} />
              

              {/* Routes privées avec restrictions */}
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />

              <Route path="/sensors" element={
                <PrivateRoute allowedRoles={[ROLES.VIEWER, ROLES.TECHNICIAN, ROLES.MANAGER, ROLES.ADMIN]}>
                  <SensorList />
                </PrivateRoute>
              } />

              <Route path="/actuators" element={
                <PrivateRoute allowedRoles={[ROLES.TECHNICIAN, ROLES.MANAGER, ROLES.ADMIN]}>
                  <ActuatorList />
                </PrivateRoute>
              } />

              <Route path="/roles" element={
                <PrivateRoute allowedRoles={[ROLES.ADMIN]}>
                  <AdminAssignRoles />
                </PrivateRoute>
              } />

              {/* Route par défaut */}
              <Route path="*" element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />
            </Routes>
          </React.Suspense>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;