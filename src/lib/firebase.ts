import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

/**
 * Firebase Web Client Configuration for PG Ease.
 * Project ID: pgease-web. Sender ID must stay 1057628082734 — that is the
 * project the backend service account belongs to. Do not mix in another app.
 * Cloud Firestore Region: asia-south1 (Mumbai)
 */
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB3oLi_x9gl0wQKtcB34jf-Ie7bj0uggvs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "pgease-web.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "pgease-web",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "pgease-web.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1057628082734",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1057628082734:web:e82937ba84912953",
};

/** Throws before Firebase Auth is called when the web config cannot succeed. */
export function assertFirebaseConfig(): void {
  const { apiKey, projectId, messagingSenderId, appId } = firebaseConfig;
  if (!apiKey || apiKey.includes("Dummy")) {
    throw new Error(
      "Firebase API key is missing. In Firebase Console open project pgease-web, Project settings, your web app, and set VITE_FIREBASE_API_KEY from that config.",
    );
  }
  if (projectId === "pgease-web" && messagingSenderId !== "1057628082734") {
    throw new Error(
      "Firebase config is from another project. Group chat uses pgease-web, whose sender ID is 1057628082734.",
    );
  }
  if (appId && !appId.startsWith(`1:${messagingSenderId}:`)) {
    throw new Error(
      "Firebase appId does not match messagingSenderId. Copy a single web app config. Duplicate keys in the object keep only the last value.",
    );
  }
}

function usableApiKey(key: string): boolean {
  return key.startsWith("AIza") && key.length >= 30 && !key.includes("Dummy");
}

function startFirebase(): { auth: Auth; firestore: Firestore } | null {
  if (!usableApiKey(firebaseConfig.apiKey)) return null;
  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    return { auth: getAuth(app), firestore: getFirestore(app) };
  } catch (error) {
    console.warn("[Firebase] Not started. Check VITE_FIREBASE_API_KEY.", error);
    return null;
  }
}

const firebase = startFirebase();

export const auth: Auth | null = firebase?.auth ?? null;
export const firestore: Firestore | null = firebase?.firestore ?? null;
