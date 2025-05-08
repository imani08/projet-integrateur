const User = require("../models/User");
const { db } = require("../services/firebase");
const { assignUserRole } = require("../services/firebase");
const admin = require('firebase-admin'); 




const userController = {
  async getAll(req, res) {
    try {
      const users = await User.getAll();

      // Vérification si certains utilisateurs n'ont pas d'UID et ajout de l'UID si nécessaire
      users.forEach(async (user) => {
        if (!user.uid) {
          console.warn(`Utilisateur sans UID: ${user.email}`);

          // Récupère l'ID du document Firestore
          const userDocRef = await db.collection("users").doc(user.id).get();

          if (userDocRef.exists) {
            const userDoc = userDocRef.data();
            
            // Mise à jour de l'utilisateur avec l'UID (ID du document)
            await db.collection("users").doc(user.id).update({
              uid: userDocRef.id
            });

            console.log(`UID ajouté à l'utilisateur ${user.email} : ${userDocRef.id}`);
          } else {
            console.error(`Utilisateur non trouvé dans Firestore: ${user.email}`);
          }
        }
      });

      res.json(users);
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de la récupération des utilisateurs" });
    }
  },

  async getById(req, res) {
    try {
      const user = await User.getById(req.params.id);
      if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de la récupération de l'utilisateur" });
    }
  },

  async create(req, res) {
    try {
      const { email, name } = req.body;
      const newUser = await User.create({
        email,
        name,
        role: null // pas encore de rôle attribué
      });

      // Mise à jour de l'UID (ID du document) pour l'utilisateur créé
      await db.collection("users").doc(newUser.id).update({ uid: newUser.id });

      res.status(201).json(newUser);
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de la création de l'utilisateur" });
    }
  },

  async update(req, res) {
    try {
      const updatedUser = await User.update(req.params.id, req.body);
      res.json(updatedUser);
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de la mise à jour de l'utilisateur" });
    }
  },

  async delete(req, res) {
    try {
      await User.delete(req.params.id);
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de la suppression de l'utilisateur" });
    }
  },

  // ✅ Nouvelle méthode pour attribuer un rôle
  async setRole(req, res) {
    const { uid } = req.params;
    const { role } = req.body;
  
    // Validation des entrées
    if (!uid) {
      return res.status(400).json({
        error: "Paramètre manquant",
        details: "L'UID utilisateur est requis dans l'URL",
        example: "/api/users/:uid/role"
      });
    }
  
    if (!role) {
      return res.status(400).json({
        error: "Donnée manquante",
        details: "Le champ 'role' est requis dans le corps de la requête",
        valid_roles: ['admin', 'manager', 'technician', 'viewer']
      });
    }
  
    const validRoles = ['admin', 'manager', 'technician', 'viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: "Rôle invalide",
        received: role,
        valid_roles: validRoles,
        suggestion: "Vérifiez l'orthographe ou les permissions"
      });
    }
  
    try {
      const userRef = db.collection("users").doc(uid);
      const userDoc = await userRef.get();
  
      if (!userDoc.exists) {
        return res.status(404).json({
          error: "Utilisateur introuvable",
          uid,
          solution: "Vérifiez que l'utilisateur existe dans Firebase Auth"
        });
      }
  
      // Mise à jour du rôle avec métadonnées
      await userRef.update({
        role,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: req.user.uid
      });
  
      // Appel de la fonction sécurisée assignUserRole (avec token de l'appelant)
      await assignUserRole(uid, role, req.token); // Assure-toi que `req.token` contient bien le token Firebase ID
  
      res.status(200).json({
        success: true,
        uid,
        previous_role: userDoc.data().role,
        new_role: role,
        updated_at: new Date().toISOString(),
        updated_by: req.user.uid
      });
  
    } catch (error) {
      console.error("Échec mise à jour rôle:", {
        uid,
        attempted_role: role,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
  
      res.status(500).json({
        error: "Erreur serveur lors de la mise à jour du rôle",
        details: error.message
      });
    }
  }
  
};


module.exports = userController;
