const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/settingsController");

// Importer correctement le middleware depuis le fichier authMiddleware.js
const { authMiddleware } = require("../middleware/authMiddleware");  // Assurez-vous d'importer la fonction authMiddleware correctement

// Appliquer le middleware de vérification du token aux routes
router.get("/", authMiddleware, ctrl.getSettings);
router.put("/", authMiddleware, ctrl.updateSettings);

module.exports = router;
