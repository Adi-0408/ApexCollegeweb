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
      facultyEmail: (markedByEmail || '').toLowerCase(),
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
export async function getStudentResults(studentEmail, { publishedOnly = true } = {}) {
  if (!studentEmail) return [];
  try {
    const q = query(collection(db, 'exam_results'), where('studentEmail', '==', studentEmail.toLowerCase()));
    const snap = await getDocs(q);
    if (snap.empty) {
      return [];
    }
    const list = [];
    snap.forEach((d) => {
      const data = { id: d.id, ...d.data() };
      if (publishedOnly && !data.published) return;
      list.push(data);
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

// -----------------------------------------------------------------
// 1. ACADEMIC CONFIGURATION (Academic Year, Terms, Thresholds)
// -----------------------------------------------------------------
export const DEFAULT_ACADEMIC_CONFIG = {
  academicYear: '2026-2027',
  currentSemester: 'Fall 2026',
  minAttendancePercentage: 75,
  institutionName: 'Apex University',
  gradingScale: [
    { grade: 'A+', minScore: 90, gpa: 4.0 },
    { grade: 'A', minScore: 80, gpa: 3.7 },
    { grade: 'B', minScore: 70, gpa: 3.0 },
    { grade: 'C', minScore: 60, gpa: 2.0 },
    { grade: 'D', minScore: 50, gpa: 1.0 },
    { grade: 'F', minScore: 0, gpa: 0.0 },
  ],
};

export async function getAcademicConfig() {
  try {
    const snap = await getDoc(doc(db, 'academic_config', 'main'));
    if (snap.exists()) {
      return { ...DEFAULT_ACADEMIC_CONFIG, ...snap.data() };
    }
    return DEFAULT_ACADEMIC_CONFIG;
  } catch (err) {
    console.warn('getAcademicConfig warning:', err);
    return DEFAULT_ACADEMIC_CONFIG;
  }
}

export async function saveAcademicConfig(configData) {
  try {
    await setDoc(doc(db, 'academic_config', 'main'), {
      ...configData,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('saveAcademicConfig error:', err);
    throw err;
  }
}

// -----------------------------------------------------------------
// 2. INTERNAL MARKS & HOD LOCKING GATE (Gate 1)
// -----------------------------------------------------------------
export async function getInternalMarks(subjectCode, semester = 'Fall 2026') {
  try {
    const q = query(
      collection(db, 'internal_marks'),
      where('subjectCode', '==', subjectCode),
      where('semester', '==', semester)
    );
    const snap = await getDocs(q);
    const list = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
    return list;
  } catch (err) {
    console.warn('getInternalMarks warning:', err);
    return [];
  }
}

export async function saveInternalMarksRecord(studentEmail, subjectCode, semester, marks, maxMarks = 30, facultyEmail = '') {
  try {
    const docId = `${studentEmail.toLowerCase()}_${subjectCode}_${semester.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
    // Check if already locked by HOD
    const existing = await getDoc(doc(db, 'internal_marks', docId));
    if (existing.exists() && existing.data().lockedByHOD) {
      throw new Error(`Marks for ${subjectCode} are LOCKED by the HOD and cannot be modified.`);
    }

    await setDoc(doc(db, 'internal_marks', docId), {
      studentEmail: studentEmail.toLowerCase(),
      subjectCode,
      semester,
      marks: Number(marks),
      maxMarks: Number(maxMarks),
      facultyEmail: facultyEmail.toLowerCase(),
      lockedByHOD: false,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('saveInternalMarksRecord error:', err);
    throw err;
  }
}

export async function lockSubjectInternalMarks(subjectCode, semester, hodEmail) {
  try {
    const q = query(
      collection(db, 'internal_marks'),
      where('subjectCode', '==', subjectCode),
      where('semester', '==', semester)
    );
    const snap = await getDocs(q);
    const updates = [];
    snap.forEach((d) => {
      updates.push(updateDoc(d.ref, {
        lockedByHOD: true,
        lockedBy: hodEmail.toLowerCase(),
        lockedAt: serverTimestamp(),
      }));
    });
    await Promise.all(updates);

    // Also record in audit trail
    await addDoc(collection(db, 'results_audit_trail'), {
      action: 'HOD_INTERNAL_MARKS_LOCK',
      subjectCode,
      semester,
      performedBy: hodEmail.toLowerCase(),
      timestamp: serverTimestamp(),
      details: `HOD locked internal marks for ${subjectCode} (${semester}) across ${snap.size} students.`,
    });

    return true;
  } catch (err) {
    console.error('lockSubjectInternalMarks error:', err);
    throw err;
  }
}

// -----------------------------------------------------------------
// 3. EXAM ELIGIBILITY & HALL TICKETS (Exam Cell)
// -----------------------------------------------------------------
export async function checkStudentExamEligibility(studentEmail) {
  if (!studentEmail) return { eligible: false, reasons: ['No student email provided'] };
  try {
    const emailNorm = studentEmail.toLowerCase();
    const reasons = [];

    // 1. Check Attendance
    const attendanceRecords = await getStudentAttendance(emailNorm);
    let avgAttendance = 100;
    if (attendanceRecords.length > 0) {
      const totalAtt = attendanceRecords.reduce((sum, r) => sum + r.attendedClasses, 0);
      const totalClasses = attendanceRecords.reduce((sum, r) => sum + r.totalClasses, 0);
      avgAttendance = totalClasses > 0 ? (totalAtt / totalClasses) * 100 : 100;
    }
    const attPassed = avgAttendance >= 75;
    if (!attPassed) {
      reasons.push(`Attendance is ${avgAttendance.toFixed(1)}% (minimum 75% required).`);
    }

    // 2. Check Fees
    const fees = await getStudentFees(emailNorm);
    let feesPassed = true;
    if (fees) {
      const pending = Number(fees.pendingDues || fees.dueAmount || 0);
      if (pending > 0 && fees.status !== 'Paid' && fees.status !== 'Cleared') {
        feesPassed = false;
        reasons.push(`Outstanding tuition balance: $${pending}. Fee clearance required.`);
      }
    }

    const eligible = attPassed && feesPassed;
    return {
      eligible,
      attendancePercentage: Number(avgAttendance.toFixed(1)),
      attendancePassed: attPassed,
      feesPassed,
      reasons,
    };
  } catch (err) {
    console.warn('checkStudentExamEligibility warning:', err);
    return { eligible: false, reasons: ['Failed to compute eligibility: ' + err.message] };
  }
}

export async function issueHallTicket(studentEmail, hallTicketData) {
  try {
    const docId = `${studentEmail.toLowerCase()}_${(hallTicketData.semester || 'Fall 2026').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
    await setDoc(doc(db, 'hall_tickets', docId), {
      studentEmail: studentEmail.toLowerCase(),
      ...hallTicketData,
      issuedAt: serverTimestamp(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('issueHallTicket error:', err);
    throw err;
  }
}

export async function getStudentHallTicket(studentEmail, semester = 'Fall 2026') {
  if (!studentEmail) return null;
  try {
    const docId = `${studentEmail.toLowerCase()}_${semester.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
    const snap = await getDoc(doc(db, 'hall_tickets', docId));
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err) {
    console.warn('getStudentHallTicket warning:', err);
    return null;
  }
}

// -----------------------------------------------------------------
// 4. RESULTS SIGN-OFF GATE & PUBLISHING (Principal & Exam Cell)
// -----------------------------------------------------------------
export async function signOffSemesterResults(semester, principalEmail) {
  try {
    const q = query(
      collection(db, 'exam_results'),
      where('semester', '==', semester)
    );
    const snap = await getDocs(q);
    const updates = [];
    snap.forEach((d) => {
      updates.push(updateDoc(d.ref, {
        principalSignedOff: true,
        signedOffBy: principalEmail.toLowerCase(),
        signedOffAt: serverTimestamp(),
      }));
    });
    await Promise.all(updates);

    await addDoc(collection(db, 'results_audit_trail'), {
      action: 'PRINCIPAL_RESULTS_SIGNOFF',
      semester,
      performedBy: principalEmail.toLowerCase(),
      timestamp: serverTimestamp(),
      details: `Principal / Dean signed off on all semester ${semester} results (${snap.size} records).`,
    });

    return true;
  } catch (err) {
    console.error('signOffSemesterResults error:', err);
    throw err;
  }
}

export async function publishSemesterResults(semester, examCellEmail) {
  try {
    const q = query(
      collection(db, 'exam_results'),
      where('semester', '==', semester)
    );
    const snap = await getDocs(q);
    const updates = [];
    snap.forEach((d) => {
      const data = d.data();
      if (!data.principalSignedOff) {
        throw new Error('Cannot publish results: Principal sign-off has not been completed yet (Approval Gate 2).');
      }
      updates.push(updateDoc(d.ref, {
        published: true,
        publishedBy: examCellEmail.toLowerCase(),
        publishedAt: serverTimestamp(),
      }));
    });
    await Promise.all(updates);

    await addDoc(collection(db, 'results_audit_trail'), {
      action: 'EXAM_CELL_PUBLISH_RESULTS',
      semester,
      performedBy: examCellEmail.toLowerCase(),
      timestamp: serverTimestamp(),
      details: `Exam cell officially published results for ${semester} to student portals.`,
    });

    return true;
  } catch (err) {
    console.error('publishSemesterResults error:', err);
    throw err;
  }
}

// -----------------------------------------------------------------
// 5. REVALUATION & AUDIT TRAIL
// -----------------------------------------------------------------
export async function submitRevaluationRequest(studentEmail, semester, subjectCode, reason) {
  try {
    const requestRef = await addDoc(collection(db, 'revaluation_requests'), {
      studentEmail: studentEmail.toLowerCase(),
      semester,
      subjectCode,
      reason,
      status: 'Submitted', // 'Submitted' | 'Under Review' | 'Completed'
      createdAt: serverTimestamp(),
    });

    await addDoc(collection(db, 'results_audit_trail'), {
      action: 'REVALUATION_REQUEST_FILED',
      studentEmail: studentEmail.toLowerCase(),
      semester,
      subjectCode,
      reason,
      requestId: requestRef.id,
      timestamp: serverTimestamp(),
    });

    return requestRef.id;
  } catch (err) {
    console.error('submitRevaluationRequest error:', err);
    throw err;
  }
}

export async function processRevaluation(requestId, studentEmail, semester, subjectCode, newMarks, reviewerEmail, auditNotes) {
  try {
    // 1. Update Result
    const semKey = semester.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const docId = `${studentEmail.toLowerCase()}_${semKey}`;
    const resultDoc = await getDoc(doc(db, 'exam_results', docId));

    let oldMarks = null;
    if (resultDoc.exists()) {
      const data = resultDoc.data();
      const updatedSubjects = (data.subjects || []).map((sub) => {
        if (sub.code === subjectCode) {
          oldMarks = sub.total;
          const total = Number(newMarks);
          let grade = 'F';
          if (total >= 90) grade = 'A+';
          else if (total >= 80) grade = 'A';
          else if (total >= 70) grade = 'B';
          else if (total >= 60) grade = 'C';
          else if (total >= 50) grade = 'D';
          return { ...sub, total, grade, revaluated: true };
        }
        return sub;
      });

      await updateDoc(doc(db, 'exam_results', docId), {
        subjects: updatedSubjects,
        revaluated: true,
        revaluatedAt: serverTimestamp(),
      });
    }

    // 2. Mark request as completed
    if (requestId) {
      await updateDoc(doc(db, 'revaluation_requests', requestId), {
        status: 'Completed',
        oldMarks,
        newMarks: Number(newMarks),
        reviewedBy: reviewerEmail.toLowerCase(),
        reviewNotes: auditNotes,
        resolvedAt: serverTimestamp(),
      });
    }

    // 3. Append immutable audit trail log
    await addDoc(collection(db, 'results_audit_trail'), {
      action: 'REVALUATION_MARKS_UPDATED',
      studentEmail: studentEmail.toLowerCase(),
      semester,
      subjectCode,
      oldMarks,
      newMarks: Number(newMarks),
      reviewerEmail: reviewerEmail.toLowerCase(),
      auditNotes,
      timestamp: serverTimestamp(),
    });

    return true;
  } catch (err) {
    console.error('processRevaluation error:', err);
    throw err;
  }
}

