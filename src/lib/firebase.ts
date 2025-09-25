
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "studio-8215111751-90b20",
  appId: "1:1006604457879:web:c45cd30009dc97de6c56d2",
  apiKey: "AIzaSyB-aophYYXDndp469nBh29Q0X3ukRfg2KQ",
  authDomain: "studio-8215111751-90b20.firebaseapp.com",
  messagingSenderId: "1006604457879",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
