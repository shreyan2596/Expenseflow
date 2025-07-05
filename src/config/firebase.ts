import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyANZeyCJjxvd2STWm5AwDlWdHUt4fgxmjA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "edzial-hackathon.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "edzial-hackathon",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "edzial-hackathon.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "803631094362",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:803631094362:web:9c9f98faf80cfc33dc9663",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-HVBJ1JN30Z"
};

// Validate configuration
const requiredConfig = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingConfig = requiredConfig.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

if (missingConfig.length > 0) {
  console.error('Missing Firebase configuration:', missingConfig);
  throw new Error(`Missing Firebase configuration: ${missingConfig.join(', ')}`);
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Only connect to emulators in development and if they're available
if (import.meta.env.DEV) {
  let emulatorsConnected = false;
  
  try {
    // Check if we're already connected to avoid multiple connection attempts
    if (!emulatorsConnected && window.location.hostname === 'localhost') {
      // Test if emulators are available before connecting
      const testEmulatorConnection = async () => {
        try {
          const response = await fetch('http://localhost:9099', { 
            method: 'HEAD',
            mode: 'no-cors'
          });
          return true; // If we get here, emulator is likely running
        } catch {
          return false;
        }
      };

      testEmulatorConnection().then(isAvailable => {
        if (isAvailable) {
          try {
            connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
            connectFirestoreEmulator(db, 'localhost', 8080);
            connectStorageEmulator(storage, "localhost", 9199);
            emulatorsConnected = true;
            console.log("✅ Connected to Firebase emulators");
          } catch (error) {
            console.warn("⚠️ Firebase emulators already connected or connection failed:", error);
          }
        } else {
          console.log("🔥 Using production Firebase services");
        }
      }).catch(() => {
        console.log("🔥 Using production Firebase services");
      });
    }
  } catch (error) {
    console.warn("⚠️ Firebase emulator setup failed, using production:", error);
  }
} else {
  console.log("🔥 Production mode: Using Firebase production services");
}

export default app;