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
import { normalizeSystemRole, ROLES, roleLabel } from "./roles.js";

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
  return createStaffUser({
    email,
    password,
    name,
    role,
    createdByEmail,
  });
}

export async function createStaffUser({
  email,
  password,
  name,
  role,
  department = '',
  assignedSubjects = '',
  createdByEmail,
}) {
  const cleanEmail = email.trim().toLowerCase();
  const systemRole = normalizeSystemRole(role, {
    hasFacultyRecord: [ROLES.FACULTY, ROLES.HOD].includes(normalizeSystemRole(role)),
  });
  const cred = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, password);

  const subjectsArray = Array.isArray(assignedSubjects)
    ? assignedSubjects
    : typeof assignedSubjects === 'string'
      ? assignedSubjects.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

  const profile = {
    email: cleanEmail,
    name: name?.trim() || 'Staff User',
    role: roleLabel(systemRole),
    systemRole,
    department: department?.trim() || '',
    assignedSubjects: subjectsArray,
    initialPassword: password,
    active: true,
    createdBy: createdByEmail || 'Admin',
    createdAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'admin_users', cleanEmail), profile);

  if (systemRole === ROLES.FACULTY || systemRole === ROLES.HOD) {
    await setDoc(doc(db, 'faculty_members', cleanEmail), {
      email: cleanEmail,
      name: profile.name,
      department: profile.department || 'Academic Department',
      role: systemRole === ROLES.HOD ? 'HOD' : 'Faculty',
      systemRole,
      assignedSubjects: subjectsArray,
      initialPassword: password,
      createdBy: createdByEmail || 'Admin',
      createdAt: serverTimestamp(),
    });
  }

  return cred;
}

export async function createFacultyUser(email, password, name, department, role, assignedSubjects, createdByEmail) {
  return createStaffUser({
    email,
    password,
    name,
    role: role || 'faculty',
    department,
    assignedSubjects,
    createdByEmail,
  });
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
