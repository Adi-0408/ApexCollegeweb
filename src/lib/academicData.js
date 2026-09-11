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

// Default Sample Attendance Data for demonstration
export const DEFAULT_ATTENDANCE_SUMMARY = [
  { subjectCode: 'CS101', subjectName: 'Data Structures & Algorithms', totalClasses: 42, attendedClasses: 38, percentage: 90.5, status: 'Good' },
  { subjectCode: 'CS102', subjectName: 'Artificial Intelligence & ML', totalClasses: 36, attendedClasses: 34, percentage: 94.4, status: 'Excellent' },
  { subjectCode: 'CS103', subjectName: 'Database Management Systems', totalClasses: 40, attendedClasses: 35, percentage: 87.5, status: 'Good' },
  { subjectCode: 'MATH201', subjectName: 'Discrete Mathematics & Probability', totalClasses: 38, attendedClasses: 27, percentage: 71.1, status: 'Warning (<75%)' },
  { subjectCode: 'ENG105', subjectName: 'Technical Communication', totalClasses: 24, attendedClasses: 23, percentage: 95.8, status: 'Excellent' },
];

// Default Sample Exam Results
export const DEFAULT_EXAM_RESULTS = [
  {
    semester: 'Semester 1 (Fall 2025)',
    sgpa: '3.85 / 4.00',
    totalCredits: 20,
    status: 'Passed with Distinction',
    subjects: [
      { code: 'CS101', name: 'Data Structures & Algorithms', credits: 4, internalMarks: 28, endtermMarks: 64, totalMarks: 92, grade: 'A+' },
      { code: 'CS102', name: 'Artificial Intelligence & ML', credits: 4, internalMarks: 29, endtermMarks: 66, totalMarks: 95, grade: 'A+' },
      { code: 'CS103', name: 'Database Management Systems', credits: 4, internalMarks: 26, endtermMarks: 58, totalMarks: 84, grade: 'A' },
      { code: 'MATH201', name: 'Discrete Mathematics', credits: 4, internalMarks: 22, endtermMarks: 52, totalMarks: 74, grade: 'B+' },
      { code: 'ENG105', name: 'Technical Communication', credits: 4, internalMarks: 27, endtermMarks: 61, totalMarks: 88, grade: 'A' },
    ]
  },
  {
    semester: 'Semester 2 (Spring 2026)',
    sgpa: '3.90 / 4.00',
    totalCredits: 18,
    status: 'Passed with Distinction',
    subjects: [
      { code: 'CS201', name: 'Operating Systems & Kernel Architecture', credits: 4, internalMarks: 29, endtermMarks: 65, totalMarks: 94, grade: 'A+' },
      { code: 'CS202', name: 'Computer Networks & Security', credits: 4, internalMarks: 28, endtermMarks: 62, totalMarks: 90, grade: 'A+' },
      { code: 'CS203', name: 'Software Engineering & Agile', credits: 4, internalMarks: 27, endtermMarks: 59, totalMarks: 86, grade: 'A' },
      { code: 'MATH202', name: 'Linear Algebra & Optimization', credits: 3, internalMarks: 25, endtermMarks: 55, totalMarks: 80, grade: 'A-' },
      { code: 'LAB201', name: 'Advanced Systems Lab', credits: 3, internalMarks: 30, endtermMarks: 68, totalMarks: 98, grade: 'A+' },
    ]
  }
];

// Default Sample Timetable
export const DEFAULT_TIMETABLE = [
  { day: 'Monday', time: '09:00 AM - 10:30 AM', subject: 'Data Structures & Algorithms', room: 'Lab 302', faculty: 'Dr. Robert Miller', type: 'Lecture & Lab' },
  { day: 'Monday', time: '11:00 AM - 12:30 PM', subject: 'Artificial Intelligence & ML', room: 'Hall B-12', faculty: 'Dr. Sophia Chen', type: 'Lecture' },
  { day: 'Monday', time: '02:00 PM - 03:30 PM', subject: 'Database Management Systems', room: 'Lab 105', faculty: 'Prof. Alan Vance', type: 'Lab' },

  { day: 'Tuesday', time: '09:30 AM - 11:00 AM', subject: 'Discrete Mathematics', room: 'Hall A-04', faculty: 'Dr. Michael Chang', type: 'Lecture' },
  { day: 'Tuesday', time: '11:30 AM - 01:00 PM', subject: 'Operating Systems & Kernel', room: 'Hall B-12', faculty: 'Dr. Robert Miller', type: 'Lecture' },
  { day: 'Tuesday', time: '02:30 PM - 04:00 PM', subject: 'Technical Communication', room: 'Seminar Room 2', faculty: 'Prof. Emily Watson', type: 'Tutorial' },

  { day: 'Wednesday', time: '09:00 AM - 10:30 AM', subject: 'Computer Networks & Security', room: 'Hall C-08', faculty: 'Dr. David Kumar', type: 'Lecture' },
  { day: 'Wednesday', time: '11:00 AM - 01:00 PM', subject: 'Advanced Systems Lab', room: 'Supercomputer Pavilion', faculty: 'Dr. Sophia Chen', type: 'Practical' },

  { day: 'Thursday', time: '09:30 AM - 11:00 AM', subject: 'Software Engineering & Agile', room: 'Hall B-12', faculty: 'Prof. Alan Vance', type: 'Lecture' },
  { day: 'Thursday', time: '11:30 AM - 01:00 PM', subject: 'Linear Algebra & Optimization', room: 'Hall A-04', faculty: 'Dr. Michael Chang', type: 'Lecture' },

  { day: 'Friday', time: '10:00 AM - 12:00 PM', subject: 'AI & Robotics Capstone Project', room: 'Maker Lab 1', faculty: 'Dr. Sophia Chen', type: 'Project Workshop' },
];

// Default Sample Tuition Fee Record
export const DEFAULT_FEE_RECORD = {
  academicYear: '2026 - 2027',
  totalTuition: 12500,
  scholarshipAwarded: 2500,
  netTuition: 10000,
  paidAmount: 10000,
  pendingDues: 0,
  status: 'Fully Paid & Cleared',
  transactions: [
    { id: 'TXN-902148', date: '2026-08-15', description: 'Fall 2026 Term Tuition Fee', amount: 5000, method: 'Online Card Payment', status: 'Completed' },
    { id: 'TXN-908722', date: '2026-08-20', description: 'Spring 2027 Term Tuition Fee', amount: 5000, method: 'Bank Wire Transfer', status: 'Completed' },
  ]
};

// -----------------------------------------------------------------
// ATTENDANCE FUNCTIONS
// -----------------------------------------------------------------
export async function getStudentAttendance(studentEmail) {
  try {
    const q = query(collection(db, 'attendance'), where('studentEmail', '==', studentEmail.toLowerCase()));
    const snap = await getDocs(q);
    if (snap.empty) {
      return DEFAULT_ATTENDANCE_SUMMARY;
    }
    const subjectMap = {};
    snap.forEach((d) => {
      const data = d.data();
      const code = data.subjectCode || 'GEN101';
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

    const list = Object.values(subjectMap).map((sub) => {
      const pct = sub.totalClasses > 0 ? Number(((sub.attendedClasses / sub.totalClasses) * 100).toFixed(1)) : 100;
      let status = 'Good';
      if (pct >= 90) status = 'Excellent';
      else if (pct < 75) status = 'Warning (<75%)';
      return { ...sub, percentage: pct, status };
    });

    return list.length > 0 ? list : DEFAULT_ATTENDANCE_SUMMARY;
  } catch (err) {
    console.warn('getStudentAttendance warning:', err);
    return DEFAULT_ATTENDANCE_SUMMARY;
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
// EXAM RESULTS & MARKSHEET FUNCTIONS
// -----------------------------------------------------------------
export async function getStudentResults(studentEmail) {
  try {
    const q = query(collection(db, 'exam_results'), where('studentEmail', '==', studentEmail.toLowerCase()));
    const snap = await getDocs(q);
    if (snap.empty) {
      return DEFAULT_EXAM_RESULTS;
    }
    const list = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() });
    });
    return list;
  } catch (err) {
    console.warn('getStudentResults warning:', err);
    return DEFAULT_EXAM_RESULTS;
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
// TIMETABLE FUNCTIONS
// -----------------------------------------------------------------
export async function getStudentTimetable(programName) {
  try {
    const docRef = doc(db, 'timetables', 'default_schedule');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data().schedule || DEFAULT_TIMETABLE;
    }
    return DEFAULT_TIMETABLE;
  } catch (err) {
    console.warn('getStudentTimetable warning:', err);
    return DEFAULT_TIMETABLE;
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
// STUDENT FEE MANAGEMENT FUNCTIONS
// -----------------------------------------------------------------
export async function getStudentFees(studentEmail) {
  try {
    const docRef = doc(db, 'student_fees', studentEmail.toLowerCase());
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
    return DEFAULT_FEE_RECORD;
  } catch (err) {
    console.warn('getStudentFees warning:', err);
    return DEFAULT_FEE_RECORD;
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
// FACULTY MEMBERS MANAGEMENT
// -----------------------------------------------------------------
export const DEFAULT_FACULTY = [
  { id: 'fac_1', name: 'Dr. Sophia Chen', email: 'sophia.chen@apex.edu', department: 'Computer Science & AI', role: 'Professor & Lab Director', assignedSubject: 'CS102 - Artificial Intelligence & ML' },
  { id: 'fac_2', name: 'Dr. Robert Miller', email: 'robert.miller@apex.edu', department: 'Computer Science & Software', role: 'Associate Professor', assignedSubject: 'CS101 - Data Structures & Algorithms' },
  { id: 'fac_3', name: 'Prof. Alan Vance', email: 'alan.vance@apex.edu', department: 'Information Systems & Data', role: 'Senior Lecturer', assignedSubject: 'CS103 - Database Management Systems' },
  { id: 'fac_4', name: 'Dr. Michael Chang', email: 'michael.chang@apex.edu', department: 'Mathematics & Computing', role: 'Professor', assignedSubject: 'MATH201 - Discrete Mathematics & Probability' },
];

export async function getFacultyList() {
  try {
    const snap = await getDocs(collection(db, 'faculty_members'));
    if (snap.empty) {
      return DEFAULT_FACULTY;
    }
    const list = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
    return list;
  } catch (err) {
    console.warn('getFacultyList warning:', err);
    return DEFAULT_FACULTY;
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
