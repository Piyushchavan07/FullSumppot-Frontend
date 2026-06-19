import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import type { ConfirmationResult } from "firebase/auth";

// These will be loaded from the user's .env file.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "placeholder-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "placeholder-auth-domain",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "placeholder-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "placeholder-storage-bucket",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "placeholder-sender-id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "placeholder-app-id"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Helper to format Indian phone numbers to E.164 (e.g. 9876543210 -> +919876543210)
export const formatIndianPhone = (phone: string) => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return `+${cleaned}`;
  }
  return phone.startsWith("+") ? phone : `+${phone}`;
};

export { RecaptchaVerifier, signInWithPhoneNumber };
export type { ConfirmationResult };
