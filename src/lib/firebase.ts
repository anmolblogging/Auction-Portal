import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "build-dummy",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "build-dummy",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://build-dummy.firebaseio.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "build-dummy",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "build-dummy",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "build-dummy",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "build-dummy"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const database = getDatabase(app);