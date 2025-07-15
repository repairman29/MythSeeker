import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Demo Firebase configuration for testing
// In production, replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "demo-key",
  authDomain: "demo.firebaseapp.com",
  databaseURL: "https://demo-default-rtdb.firebaseio.com",
  projectId: "demo",
  storageBucket: "demo.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:demo"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);

// Demo mode - uses local storage instead of Firebase for testing
export const useDemoMode = true; 