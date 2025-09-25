
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: "studio-8215111751-90b20",
  appId: "1:1006604457879:web:c45cd30009dc97de6c56d2",
  apiKey: "AIzaSyB-aophYYXDndp469nBh29Q0X3ukRfg2KQ",
  authDomain: "studio-8215111751-90b20.firebaseapp.com",
  messagingSenderId: "1006604457879",
  storageBucket: "studio-8215111751-90b20.appspot.com",
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
