const express = require('express');
const cors = require('cors'); // Importation de CORS
const app = express();
const initFirestore = require("./services/initFirestore");

// Permet de configurer CORS pour permettre à ton frontend sur Vercel de communiquer avec ton backend
app.use(cors({
  origin: 'https://ton-frontend-vercel-url.vercel.app', // URL de ton frontend Vercel
  methods: ['GET', 'POST'],
}));

// Autres middlewares
app.use(express.json());

// Routes de ton backend
app.get("/", (req, res) => {
  res.send("Backend connecté !");
});

// Lancement de l’API sur un port défini
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  await initFirestore(); // <--- Lancement de l'init automatique ici
});
