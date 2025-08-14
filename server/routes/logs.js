const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/logController");
const { authMiddleware: verifyToken } = require("../middleware/authMiddleware");

// Route GET pour récupérer les logs avec pagination et authentification
router.get("/", verifyToken, ctrl.getLogs);

module.exports = router;
