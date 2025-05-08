const express = require("express");
const router = express.Router();
const controller = require("../controllers/userController");
const { authMiddleware, checkAuthenticated } = require("../middleware/authMiddleware");

// 🔐 Middleware d'authentification pour toutes les routes
router.use(authMiddleware);

// 👀 Route pour voir tous les utilisateurs (accessible à tous les connectés)
router.get("/", controller.getAll);

// 🔍 Voir un utilisateur par ID
router.get("/:id", controller.getById);

// ✏️ Mettre à jour un utilisateur (par lui-même ou par un admin)
router.put("/:id", controller.update);

// 🗑️ Supprimer un utilisateur (admin uniquement)
router.delete("/:id", checkAuthenticated, controller.delete);

// ➕ Créer un utilisateur (sans restriction ici, si besoin tu peux le déplacer ailleurs)
router.post("/", controller.create);

// 🛠️ Attribuer un rôle (admin uniquement)
router.patch("/set-role/:uid", checkAuthenticated, controller.setRole); // <- à créer dans le contrôleur

module.exports = router;
