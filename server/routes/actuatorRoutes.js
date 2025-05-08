const express = require("express");
const router = express.Router();
const controller = require("../controllers/actuatorController");
const { authMiddleware, checkHasRole, checkAuthenticated } = require("../middleware/authMiddleware");  // Corrigez l'importation ici

// Appliquez le middleware d'authentification sur toutes les routes
router.use(authMiddleware);  // Assurez-vous que c'est la fonction middleware

// Routes pour les actionneurs
router.get("/", controller.getAll);  // Cette route nécessite déjà l'authentification
router.get("/:id", controller.getById);  // Cette route nécessite déjà l'authentification
router.post("/", controller.create);  // Cette route nécessite déjà l'authentification
router.put("/:id", controller.update);  // Cette route nécessite déjà l'authentification
router.delete("/:id", controller.delete);  // Cette route nécessite déjà l'authentification
router.patch("/:id/toggle", controller.toggleStatus);  // Cette route nécessite déjà l'authentification

module.exports = router;
