import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDMjPxIn42jeTVD0qksgZjoM9JR7nxLTxo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "cleber-9a012.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "cleber-9a012",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "cleber-9a012.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "174918177595",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:174918177595:web:341eabeb3c8d8144a75d1e",
} as const;

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export { app };
export default firebaseConfig;
