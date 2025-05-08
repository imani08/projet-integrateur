import axios from 'axios';
import { getAuth } from 'firebase/auth';

// Utilise l'URL publique de ton backend
const API_URL = 'https://projet-integrateur.onrender.com/api';

const api = axios.create({
  baseURL: API_URL
});

// Intercepteur pour ajouter le token Firebase
api.interceptors.request.use(async (config) => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
