const express = require("express");
const router = express.Router();
const controller = require("../controllers/alertController");

// Importer correctement le middleware depuis le fichier authMiddleware.js
const { authMiddleware } = require("../middleware/authMiddleware");  // Assurez-vous d'importer la fonction authMiddleware correctement

// Utiliser la fonction middleware comme middleware
router.use(authMiddleware);

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.delete);

module.exports = router;
