import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { auth } from './services/firebase';
import reportWebVitals from '../reportWebVitals';
import './index.css';

// Attendre que Firebase détecte l'état d'authentification
auth.onAuthStateChanged(() => {
  const container = document.getElementById('root');
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});

reportWebVitals();
