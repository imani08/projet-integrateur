const { auth, db, admin } = require("../services/firebase");

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token manquant" });

  try {
    const decoded = await auth.verifyIdToken(token);
    const uid = decoded.uid;

    //  Récupération de l'utilisateur dans Firestore
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    let userData;

    if (!userDoc.exists) {
      //  Création automatique du document utilisateur si non existant
      userData = {
        email: decoded.email || null,
        role: "viewer", // Rôle par défaut pour les nouveaux utilisateurs
        createdAt: new Date().toISOString()
      };
      await userRef.set(userData);

      console.log("👤 Document utilisateur créé automatiquement dans Firestore.");
    } else {
      userData = userDoc.data();
    }

    // Vérification que le rôle est valide
    const validRoles = ["admin", "manager", "technician", "viewer"];
    if (userData.role && !validRoles.includes(userData.role)) {
      return res.status(403).json({ error: "Rôle utilisateur invalide" });
    }

    req.user = {
      uid: uid,
      email: decoded.email,
      role: userData.role || "viewer" // Valeur par défaut si le rôle n'est pas défini
    };
    console.log("User role:", req.user?.role); // Voir le rôle dans les logs
    console.log("Request path:", req.path); // Voir quelle route est appelée

    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ error: "Token invalide" });
  }
};


//  Vérifie que l'utilisateur a un rôle attribué
const checkHasRole = (req, res, next) => {
  if (!req.user?.role) {
    return res.status(403).json({ error: "Accès refusé : rôle non attribué." });
  }
  next();
};

// ✅ Vérifie que l'utilisateur est un admin
const checkAuthenticated = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Token manquant" });

    // Vérifier et décoder le token JWT
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Tu peux attacher les infos de l'utilisateur au req pour un usage futur si nécessaire
    req.user = decodedToken;

    next(); // Autoriser la suite
  } catch (error) {
    console.error("Erreur checkAuthenticated:", error);
    res.status(403).json({
      error: "Accès refusé",
      details: error.message,
    });
  }
};



// ✅ Vérifie que l'utilisateur est un manager ou admin
const checkManagerOrAdmin = (req, res, next) => {
  if (!["admin", "manager"].includes(req.user?.role)) {
    return res.status(403).json({ error: "Accès refusé : seuls les managers et administrateurs sont autorisés." });
  }
  next();
};

// ✅ Vérifie que l'utilisateur est un technician, manager ou admin
const checkTechnicianOrAbove = (req, res, next) => {
  if (!["admin", "manager", "technician"].includes(req.user?.role)) {
    return res.status(403).json({ error: "Accès refusé : seuls les technicians, managers et administrateurs sont autorisés." });
  }
  next();
};

module.exports = {
  authMiddleware,
  checkHasRole,
  checkAuthenticated,
  checkManagerOrAdmin,
  checkTechnicianOrAbove
};