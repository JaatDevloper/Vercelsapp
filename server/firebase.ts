import admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

const serviceAccountPath = path.resolve(process.cwd(), "server/config/firebase-service-account.json");

if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  console.log("Firebase Admin SDK initialized successfully");
} else {
  console.warn("Firebase service account file not found. Firebase features will be disabled.");
}

export const db = admin.apps.length ? admin.firestore() : null;
export default admin;
