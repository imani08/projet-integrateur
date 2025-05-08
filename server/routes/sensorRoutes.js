const express = require("express");
const router = express.Router();
const { authMiddleware, checkHasRole, checkAuthenticated } = require("../middleware/authMiddleware");
const controller = require("../controllers/sensorController");

// Appliquer authMiddleware à toutes les routes suivantes
router.use(authMiddleware);

// Exemple de route accessible à plusieurs rôles (admin, manager, technician)
router.get("/", checkHasRole, controller.getAll);

// Exemple de route réservée uniquement aux administrateurs
router.get("/admin", checkAuthenticated, controller.getAll);

// Autres routes sans rôle ou admin
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.delete);

module.exports = router;
