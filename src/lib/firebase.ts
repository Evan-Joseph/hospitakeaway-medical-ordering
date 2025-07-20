
// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, initializeFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth"; // Import getAuth
import { getStorage } from "firebase/storage"; // Import getStorage

// Your web app's Firebase configuration
// IMPORTANT: Replace with your actual Firebase project configuration!
const firebaseConfig = {
  apiKey: "AIzaSyDStQeC5TeQrlVnKG08llMQcuj0fNAVKyY",
  authDomain: "mediorder-9suf6.firebaseapp.com",
  projectId: "mediorder-9suf6",
  storageBucket: "mediorder-9suf6.appspot.com", // Make sure this is correct, often .appspot.com
  messagingSenderId: "817473525117",
  appId: "1:817473525117:web:69c8ebe167c359b87e2814"
  // measurementId: "G-XXXXXXXXXX" // Optional, if you use Google Analytics
};


let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let storage; // Declare storage

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
});

auth = getAuth(app);
storage = getStorage(app); // Initialize storage

if (process.env.NODE_ENV === 'development') {
  console.log("Firebase initialized with Project ID:", firebaseConfig.projectId);
  // To connect to emulators (if you decide to use them later):
  // import { connectFirestoreEmulator } from "firebase/firestore";
  // import { connectAuthEmulator } from "firebase/auth";
  // import { connectStorageEmulator } from "firebase/storage";
  // connectFirestoreEmulator(db, 'localhost', 8080);
  // connectAuthEmulator(auth, 'http://localhost:9099');
  // connectStorageEmulator(storage, 'localhost', 9199);
}

export { app, db, auth, storage }; // Export auth and storage
