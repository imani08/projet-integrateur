import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const setAdminRole = functions.https.onCall(async (data, context) => {
  // Vérification sécurité - seul un superadmin peut attribuer ce rôle
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied', 
      'Seul un administrateur peut effectuer cette action'
    );
  }

  try {
    // Ajout du claim "role: admin"
    await admin.auth().setCustomUserClaims(data.uid, {
      role: 'admin'
    });
    
    // Invalidation des tokens existants
    await admin.auth().revokeRefreshTokens(data.uid);
    
    return { success: true };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});