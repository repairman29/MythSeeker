import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getFunctions } from 'firebase/functions';

// Firebase configuration for mythseekers-rpg project
const firebaseConfig = {
  apiKey: "AIzaSyAVJvau3Hit06q1pNYCTOF-pVuutmk4oNQ",
  authDomain: "mythseekers-rpg.firebaseapp.com",
  databaseURL: "https://mythseekers-rpg-default-rtdb.firebaseio.com",
  projectId: "mythseekers-rpg",
  storageBucket: "mythseekers-rpg.firebasestorage.app",
  messagingSenderId: "659018227506",
  appId: "1:659018227506:web:82425e7adaf80c2e3c412b",
  measurementId: "G-E3T1V81ZX3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const functions = getFunctions(app);

// Production mode - uses real Firebase
export const useDemoMode = false; 