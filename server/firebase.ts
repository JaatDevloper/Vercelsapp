import admin from "firebase-admin";

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (serviceAccountJson) {
  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    console.log("Firebase Admin SDK initialized successfully via environment variable");
  } catch (error) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", error);
  }
} else {
  console.warn("FIREBASE_SERVICE_ACCOUNT_JSON secret not found. Firebase features will be disabled.");
}

export const db = admin.apps.length ? admin.firestore() : null;
export default admin;
