const admin = require("firebase-admin");
const path = require("path");
const { v4: uuidv4 } = require('uuid');

// Chargement sécurisé des credentials
const serviceAccountPath = path.join(__dirname, "./firebase-admin.json");
const serviceAccount = require(serviceAccountPath);

// Initialisation robuste de l'admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://arcane-indexer-455616-c8.firebaseio.com"
  });
}

const db = admin.firestore();
const auth = admin.auth();

// Vérification de santé des services Firebase
async function checkFirebaseHealth() {
  try {
    await Promise.all([
      db.collection("healthcheck").doc("test").get(),
      auth.listUsers(1)
    ]);
    console.log("✅ Tous les services Firebase fonctionnent correctement");
    return true;
  } catch (error) {
    console.error("❌ Erreur de connexion à Firebase:", error);
    throw new Error("Service Firebase indisponible");
  }
}

// Fonction optimisée pour synchroniser les claims
async function syncUserClaims(uid, forceRefresh = false) {
  try {
    // Récupère les données utilisateur depuis Firestore
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new Error(`Utilisateur ${uid} non trouvé`);
    }

    const userData = userDoc.data();
    const role = userData.role || "viewer"; // Définit le rôle, par défaut "viewer"

    // Définition des claims dynamiques basés sur le rôle
    const newClaims = {
      admin: role === "admin",
      manager: role === "manager",
      technician: role === "technician",
      viewer: role === "viewer",
      role,
      lastSync: Date.now() // Date de dernière synchronisation des claims
    };

    // Récupère les claims actuels de l'utilisateur depuis Firebase Auth
    const userRecord = await auth.getUser(uid);
    const currentClaims = userRecord.customClaims || {};

    // Supprime les champs volatiles (comme lastSync) pour une comparaison propre
    const claimsToCompare = { ...currentClaims };
    delete claimsToCompare.lastSync;

    const newClaimsToCompare = { ...newClaims };
    delete newClaimsToCompare.lastSync;

    // Vérifie si une mise à jour des claims est nécessaire
    const needsUpdate =
      JSON.stringify(claimsToCompare) !== JSON.stringify(newClaimsToCompare);

    if (needsUpdate || forceRefresh) {
      // Applique les nouvelles claims si elles diffèrent
      await auth.setCustomUserClaims(uid, newClaims);
      await auth.revokeRefreshTokens(uid); // Force la réinitialisation des tokens

      // Journalisation des modifications des claims
      await db.collection("audit_logs").doc(uuidv4()).set({
        action: "claims_update",
        uid,
        email: userData.email || userRecord.email || "non_renseigné",
        oldClaims: currentClaims,
        newClaims,
        updatedBy: "system", // Ou req.user.uid si appelé par un admin
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`✅ Claims mis à jour pour ${uid}`);
      return { updated: true, claims: newClaims };
    }

    console.log(`ℹ️ Aucun changement nécessaire pour ${uid}`);
    return { updated: false, claims: currentClaims };

  } catch (error) {
    console.error(`❌ Erreur dans syncUserClaims (${uid}):`, error.message);
    
    // Gestion d'erreurs détaillée
    if (error.message.includes('Utilisateur non trouvé')) {
      alert('Erreur : Utilisateur non trouvé dans la base de données.');
    } else if (error.message.includes('auth/invalid-uid')) {
      alert('Erreur : UID utilisateur invalide.');
    } else {
      alert(`Erreur inconnue : ${error.message}`);
    }

    throw error; // Propagation de l'erreur pour le traitement ultérieur
  }
}


// Version sécurisée de assignUserRole


// ✅ Fonction corrigée — pas d'appel récursif
async function assignUserRole(uid, role) {
  if (!uid || !role) {
    throw new Error("Paramètres manquants");
  }

  const customClaims = { role };

  // Mise à jour des custom claims de l'utilisateur
  await admin.auth().setCustomUserClaims(uid, customClaims);
}

module.exports = {
  db,
  auth,
  admin,
  checkFirebaseHealth,
  syncUserClaims,
  assignUserRole,

  forceSyncUser: async (uid) => {
    try {
      await checkFirebaseHealth();
      const result = await syncUserClaims(uid, true);
      const user = await auth.getUser(uid);
      return {
        ...result,
        userInfo: {
          uid: user.uid,
          email: user.email,
          currentClaims: user.customClaims
        }
      };
    } catch (error) {
      console.error("🚨 Erreur dans forceSyncUser:", error);
      throw error;
    }
  }
};



// Export avec gestion d'erreur
module.exports = {
  db,
  auth,
  admin,
  checkFirebaseHealth,
  syncUserClaims,
  assignUserRole,
  
  forceSyncUser: async (uid) => {
    try {
      await checkFirebaseHealth();
      const result = await syncUserClaims(uid, true);
      const user = await auth.getUser(uid);
      return {
        ...result,
        userInfo: {
          uid: user.uid,
          email: user.email,
          currentClaims: user.customClaims
        }
      };
    } catch (error) {
      console.error("🚨 Erreur dans forceSyncUser:", error);
      throw error;
    }
  }
};