const { db } = require("../services/firebase");

class User {
  constructor(uid, email, role = "user", createdAt = new Date()) {
    this.uid = uid;
    this.email = email;
    this.role = role;
    this.createdAt = createdAt;
  }

  static async getByUID(uid) {
    const snapshot = await db.collection("users").where("uid", "==", uid).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  static async create(data) {
    const docRef = await db.collection("users").add(data);
    return { id: docRef.id };
  }

  static async getAll() {
    const snapshot = await db.collection("users").get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}

module.exports = User;
