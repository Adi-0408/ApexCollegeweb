import {
  db,
  collection,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp
} from './firebase.js';

// -----------------------------------------------------------------
// ATTENDANCE FUNCTIONS (Strictly Firestore Data Only)
// -----------------------------------------------------------------
export async function getStudentAttendance(studentEmail) {
  if (!studentEmail) return [];
  try {
    const q = query(collection(db, 'attendance'), where('studentEmail', '==', studentEmail.toLowerCase()));
    const snap = await getDocs(q);
    if (snap.empty) {
      return [];
    }
    const subjectMap = {};
    snap.forEach((d) => {
      const data = d.data();
      const code = data.subjectCode || 'CS101';
      if (!subjectMap[code]) {
        subjectMap[code] = {
          subjectCode: code,
          subjectName: data.subjectName || code,
          totalClasses: 0,
          attendedClasses: 0,
        };
      }
      subjectMap[code].totalClasses += 1;
      if (data.status === 'Present' || data.status === 'Late') {
        subjectMap[code].attendedClasses += 1;
      }
    });

    return Object.values(subjectMap).map((sub) => {
      const pct = sub.totalClasses > 0 ? Number(((sub.attendedClasses / sub.totalClasses) * 100).toFixed(1)) : 100;
      let status = 'Good';
      if (pct >= 90) status = 'Excellent';
      else if (pct < 75) status = 'Warning (<75%)';
      return { ...sub, percentage: pct, status };
    });
  } catch (err) {
    console.warn('getStudentAttendance warning:', err);
    return [];
  }
}

export async function markCourseAttendance(studentEmail, subjectCode, subjectName, date, status, markedByEmail) {
  try {
    const docId = `${studentEmail.toLowerCase()}_${subjectCode}_${date}`;
    await setDoc(doc(db, 'attendance', docId), {
      studentEmail: studentEmail.toLowerCase(),
      subjectCode,
      subjectName,
      date,
      status, // 'Present' | 'Absent' | 'Late'
      markedBy: markedByEmail || 'Faculty',
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('markCourseAttendance error:', err);
    throw err;
  }
}

// -----------------------------------------------------------------
// EXAM RESULTS & MARKSHEET FUNCTIONS (Strictly Firestore Data Only)
// -----------------------------------------------------------------
export async function getStudentResults(studentEmail) {
  if (!studentEmail) return [];
  try {
    const q = query(collection(db, 'exam_results'), where('studentEmail', '==', studentEmail.toLowerCase()));
    const snap = await getDocs(q);
    if (snap.empty) {
      return [];
    }
    const list = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() });
    });
    return list;
  } catch (err) {
    console.warn('getStudentResults warning:', err);
    return [];
  }
}

export async function saveStudentResults(studentEmail, semesterData) {
  try {
    const semKey = semesterData.semester.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const docId = `${studentEmail.toLowerCase()}_${semKey}`;
    await setDoc(doc(db, 'exam_results', docId), {
      studentEmail: studentEmail.toLowerCase(),
      ...semesterData,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('saveStudentResults error:', err);
    throw err;
  }
}

// -----------------------------------------------------------------
// TIMETABLE FUNCTIONS (Strictly Firestore Data Only)
// -----------------------------------------------------------------
export async function getStudentTimetable() {
  try {
    const docRef = doc(db, 'timetables', 'default_schedule');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data().schedule || [];
    }
    return [];
  } catch (err) {
    console.warn('getStudentTimetable warning:', err);
    return [];
  }
}

export async function saveTimetable(scheduleList) {
  try {
    const docRef = doc(db, 'timetables', 'default_schedule');
    await setDoc(docRef, {
      schedule: scheduleList,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.error('saveTimetable error:', err);
    throw err;
  }
}

// -----------------------------------------------------------------
// STUDENT FEE MANAGEMENT FUNCTIONS (Strictly Firestore Data Only)
// -----------------------------------------------------------------
export async function getStudentFees(studentEmail) {
  if (!studentEmail) return null;
  try {
    const docRef = doc(db, 'student_fees', studentEmail.toLowerCase());
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err) {
    console.warn('getStudentFees warning:', err);
    return null;
  }
}

export async function saveStudentFees(studentEmail, feeData) {
  try {
    const docRef = doc(db, 'student_fees', studentEmail.toLowerCase());
    await setDoc(docRef, {
      studentEmail: studentEmail.toLowerCase(),
      ...feeData,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('saveStudentFees error:', err);
    throw err;
  }
}

// -----------------------------------------------------------------
// FACULTY MEMBERS MANAGEMENT (Strictly Firestore Data Only)
// -----------------------------------------------------------------
export async function getFacultyList() {
  try {
    const snap = await getDocs(collection(db, 'faculty_members'));
    if (snap.empty) {
      return [];
    }
    const list = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
    return list;
  } catch (err) {
    console.warn('getFacultyList warning:', err);
    return [];
  }
}

export async function saveFacultyMember(facData, facId = null) {
  try {
    const id = facId || `fac_${Date.now()}`;
    await setDoc(doc(db, 'faculty_members', id), {
      ...facData,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return { id, ...facData };
  } catch (err) {
    console.error('saveFacultyMember error:', err);
    throw err;
  }
}

export async function deleteFacultyMember(facId) {
  try {
    await deleteDoc(doc(db, 'faculty_members', facId));
    return true;
  } catch (err) {
    console.error('deleteFacultyMember error:', err);
    throw err;
  }
}
