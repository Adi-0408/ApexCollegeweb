import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, onAuthStateChanged, collection, query, where, onSnapshot } from '../lib/firebase.js';

const AuthContext = createContext(null);

export const DEFAULT_ADMIN_EMAILS = ['admin@apex.edu', 'adityapatil.4132@gmail.com'];
export const ADMIN_EMAILS = DEFAULT_ADMIN_EMAILS;

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(undefined); // undefined = initial loading
  const [studentApplication, setStudentApplication] = useState(null);
  const [appStatus, setAppStatus] = useState(null);
  const [isAccepted, setIsAccepted] = useState(false);
  const [adminEmails, setAdminEmails] = useState(DEFAULT_ADMIN_EMAILS);

  // Dynamic admin check against default admins + Firestore staff collection
  const isAdmin = !!(
    currentUser?.email && adminEmails.includes(currentUser.email.toLowerCase())
  );

  useEffect(() => {
    let appUnsub = null;
    let asstUnsub = null;

    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user && user.email) {
        // 1. Student Application Listener
        const q = query(collection(db, 'applications'), where('email', '==', user.email));
        appUnsub = onSnapshot(
          q,
          (snap) => {
            if (snap.empty) {
              setStudentApplication(null);
              setAppStatus(null);
              setIsAccepted(false);
            } else {
              let accepted = false;
              let currentData = null;
              snap.forEach((d) => {
                const data = d.data();
                const status = (data.status || 'Pending').toLowerCase();
                currentData = { id: d.id, ...data };
                if (status === 'accepted') {
                  accepted = true;
                }
              });
              setStudentApplication(currentData);
              setAppStatus(currentData?.status?.toLowerCase() || null);
              setIsAccepted(accepted);
            }
          },
          (err) => console.warn('AuthContext apps listener:', err)
        );

        // 2. Staff/Assistant Users Listener (Runs safely when user is signed in)
        asstUnsub = onSnapshot(
          collection(db, 'admin_users'),
          (snap) => {
            const assistantEmails = [];
            snap.forEach((d) => {
              const data = d.data();
              if (data.active !== false && data.email) {
                assistantEmails.push(data.email.toLowerCase());
              }
            });
            const combined = Array.from(new Set([...DEFAULT_ADMIN_EMAILS, ...assistantEmails]));
            setAdminEmails(combined);
          },
          (err) => console.warn('Admin users listener warning:', err)
        );
      } else {
        if (appUnsub) appUnsub();
        if (asstUnsub) asstUnsub();
        setStudentApplication(null);
        setAppStatus(null);
        setIsAccepted(false);
        setAdminEmails(DEFAULT_ADMIN_EMAILS);
      }
    });

    return () => {
      unsub();
      if (appUnsub) appUnsub();
      if (asstUnsub) asstUnsub();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isAdmin,
        adminEmails,
        isAccepted,
        appStatus,
        studentApplication
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
