import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  setDoc,
  deleteDoc,
  getDoc,
  onSnapshot,
  doc,
  serverTimestamp,
  query,
  where,
  orderBy
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCvK8aO3KXlh2GO6d-lMpPej5OoqA-aDSI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "aura-college.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "aura-college",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "aura-college.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "725592116067",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:725592116067:web:f3e1dcc000e8de74f92156",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-6W99CWB5WC"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Secondary app instance for creating assistant user accounts without disturbing active admin session
const secondaryApp = getApps().find(a => a.name === 'SecondaryAdminApp') || initializeApp(firebaseConfig, 'SecondaryAdminApp');
const secondaryAuth = getAuth(secondaryApp);

export async function createAssistantUser(email, password, name, role, createdByEmail) {
  const cleanEmail = email.trim().toLowerCase();
  
  // 1. Create in Firebase Auth using secondary auth instance
  const cred = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, password);
  
  // 2. Save metadata & role in Firestore 'admin_users' collection
  await setDoc(doc(db, 'admin_users', cleanEmail), {
    email: cleanEmail,
    name: name?.trim() || 'Assistant User',
    role: role?.trim() || 'Admissions Assistant',
    initialPassword: password, // Stored so primary admin can reference/share credentials
    active: true,
    createdBy: createdByEmail || 'Admin',
    createdAt: serverTimestamp(),
  });

  return cred;
}

export {
  app,
  auth,
  db,
  firebaseConfig,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  setDoc,
  deleteDoc,
  getDoc,
  onSnapshot,
  doc,
  serverTimestamp,
  query,
  where,
  orderBy
};
