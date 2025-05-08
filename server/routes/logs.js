const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/logController");
const { authMiddleware: verifyToken } = require("../middleware/authMiddleware");  // Correction de l'importation

// Route GET pour récupérer les logs, avec le middleware de vérification du token
router.get("/", verifyToken, ctrl.getLogs);

module.exports = router;
