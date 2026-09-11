import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { auth, db, onAuthStateChanged, collection, query, where, onSnapshot, doc, getDoc } from '../lib/firebase.js';
import {
  ROLES,
  can as roleCan,
  canAccessStaffConsole,
  getStaffHomeRoute,
  isStaffRole,
  normalizeSystemRole,
  roleLabel,
} from '../lib/roles.js';

const AuthContext = createContext(null);

export const DEFAULT_ADMIN_EMAILS = ['admin@apex.edu', 'adityapatil.4132@gmail.com'];
export const ADMIN_EMAILS = DEFAULT_ADMIN_EMAILS;

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(undefined);
  const [studentApplication, setStudentApplication] = useState(null);
  const [appStatus, setAppStatus] = useState(null);
  const [isAccepted, setIsAccepted] = useState(false);
  const [adminEmails, setAdminEmails] = useState(DEFAULT_ADMIN_EMAILS);
  const [staffProfile, setStaffProfile] = useState(null);
  const [staffRole, setStaffRole] = useState(ROLES.STUDENT);

  const userEmailLower = currentUser?.email ? currentUser.email.toLowerCase() : '';
  const isStaff = isStaffRole(staffRole);
  const isFaculty = staffRole === ROLES.FACULTY || staffRole === ROLES.HOD;
  const isAdmin = canAccessStaffConsole(staffRole);

  useEffect(() => {
    let appUnsub = null;
    let asstUnsub = null;
    let facUnsub = null;

    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user && user.email) {
        const uEmail = user.email.toLowerCase();

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
                if (status === 'accepted') accepted = true;
              });
              setStudentApplication(currentData);
              setAppStatus(currentData?.status?.toLowerCase() || null);
              setIsAccepted(accepted);
            }
          },
          (err) => console.warn('AuthContext apps listener:', err)
        );

        asstUnsub = onSnapshot(
          collection(db, 'admin_users'),
          (snap) => {
            const assistantEmails = [];
            let myStaff = null;
            snap.forEach((d) => {
              const data = d.data();
              if (data.active !== false && data.email) {
                assistantEmails.push(data.email.toLowerCase());
              }
              if ((data.email || d.id || '').toLowerCase() === uEmail) {
                myStaff = { id: d.id, ...data };
              }
            });
            const combined = Array.from(new Set([...DEFAULT_ADMIN_EMAILS, ...assistantEmails]));
            setAdminEmails(combined);

            getDoc(doc(db, 'faculty_members', uEmail))
              .then((facSnap) => {
                const facultyDoc = facSnap.exists() ? { id: facSnap.id, ...facSnap.data() } : null;
                const merged = {
                  ...(facultyDoc || {}),
                  ...(myStaff || {}),
                  email: uEmail,
                  assignedSubjects: facultyDoc?.assignedSubjects || myStaff?.assignedSubjects || [],
                  department: facultyDoc?.department || myStaff?.department || '',
                };
                const role = normalizeSystemRole(merged.systemRole || merged.role, {
                  isMasterAdmin: DEFAULT_ADMIN_EMAILS.includes(uEmail),
                  hasFacultyRecord: !!facultyDoc,
                });
                if (role === ROLES.STUDENT && DEFAULT_ADMIN_EMAILS.includes(uEmail)) {
                  setStaffRole(ROLES.SUPER_ADMIN);
                  setStaffProfile({ email: uEmail, name: 'Super Admin', systemRole: ROLES.SUPER_ADMIN, assignedSubjects: [] });
                  return;
                }
                if (role === ROLES.STUDENT && !myStaff && !facultyDoc) {
                  setStaffRole(ROLES.STUDENT);
                  setStaffProfile(null);
                  return;
                }
                setStaffRole(role);
                setStaffProfile({ ...merged, systemRole: role, role: roleLabel(role) });
              })
              .catch((err) => {
                console.warn('Faculty profile load:', err);
                const role = normalizeSystemRole(myStaff?.systemRole || myStaff?.role, {
                  isMasterAdmin: DEFAULT_ADMIN_EMAILS.includes(uEmail),
                });
                setStaffRole(role);
                setStaffProfile(myStaff ? { ...myStaff, systemRole: role } : DEFAULT_ADMIN_EMAILS.includes(uEmail)
                  ? { email: uEmail, systemRole: ROLES.SUPER_ADMIN, role: roleLabel(ROLES.SUPER_ADMIN) }
                  : null);
              });
          },
          (err) => console.warn('Admin users listener warning:', err)
        );

        facUnsub = onSnapshot(doc(db, 'faculty_members', uEmail), (snap) => {
          if (!snap.exists()) return;
          const facultyDoc = { id: snap.id, ...snap.data() };
          setStaffProfile((prev) => {
            const merged = { ...(prev || {}), ...facultyDoc, email: uEmail };
            const role = normalizeSystemRole(merged.systemRole || merged.role, {
              isMasterAdmin: DEFAULT_ADMIN_EMAILS.includes(uEmail),
              hasFacultyRecord: true,
            });
            setStaffRole((current) => (current === ROLES.STUDENT || current === ROLES.FACULTY || current === ROLES.HOD ? role : current));
            return { ...merged, systemRole: role === ROLES.STUDENT ? ROLES.FACULTY : role };
          });
        });
      } else {
        if (appUnsub) appUnsub();
        if (asstUnsub) asstUnsub();
        if (facUnsub) facUnsub();
        setStudentApplication(null);
        setAppStatus(null);
        setIsAccepted(false);
        setAdminEmails(DEFAULT_ADMIN_EMAILS);
        setStaffProfile(null);
        setStaffRole(ROLES.STUDENT);
      }
    });

    return () => {
      unsub();
      if (appUnsub) appUnsub();
      if (asstUnsub) asstUnsub();
      if (facUnsub) facUnsub();
    };
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      isAuthenticated: !!currentUser,
      isAdmin,
      isFaculty,
      isStaff,
      staffRole,
      staffProfile,
      adminEmails,
      isAccepted,
      appStatus,
      studentApplication,
      can: (permission) => roleCan(staffRole, permission),
      homeRoute: getStaffHomeRoute(staffRole),
    }),
    [currentUser, isAdmin, isFaculty, isStaff, staffRole, staffProfile, adminEmails, isAccepted, appStatus, studentApplication]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
