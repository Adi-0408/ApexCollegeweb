import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, onAuthStateChanged, collection, query, where, onSnapshot } from '../lib/firebase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(undefined); // undefined = initial loading
  const [studentApplication, setStudentApplication] = useState(null);
  const [appStatus, setAppStatus] = useState(null);
  const [isAccepted, setIsAccepted] = useState(false);

  const isAdmin = !!(
    currentUser?.email && currentUser.email.toLowerCase() === 'admin@apex.edu'
  );

  useEffect(() => {
    let appUnsub = null;
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user && user.email) {
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
      } else {
        if (appUnsub) appUnsub();
        setStudentApplication(null);
        setAppStatus(null);
        setIsAccepted(false);
      }
    });
    return () => {
      unsub();
      if (appUnsub) appUnsub();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isAdmin,
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
