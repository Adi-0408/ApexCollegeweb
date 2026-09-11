import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  UserCheck,
  CheckCircle,
  Clock,
  User,
  LogOut,
  Calendar,
  Building2,
  BookOpen,
  Award,
  AlertTriangle,
  Percent,
  Check,
  XCircle,
  Save,
  Send,
  Users,
  Layers,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import {
  auth,
  db,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  collection,
  getDocs,
  query,
  where,
  setDoc,
  getDoc,
  doc,
  serverTimestamp
} from '../lib/firebase.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { markCourseAttendance, saveStudentResults, getFacultyList } from '../lib/academicData.js';

export default function FacultyPage() {
  const { currentUser, isAdmin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Login States for Faculty
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' | 'gradebook' | 'roster'

  // Attendance Marker States
  const [selectedSubject, setSelectedSubject] = useState('CS101 - Computer Science & AI');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [rosterLoading, setRosterLoading] = useState(false);

  // Dynamic Student Roll Call List fetched from Firestore applications
  const [rollCall, setRollCall] = useState([]);

  // Gradebook States
  const [gradeSemester, setGradeSemester] = useState('Semester 1 (Fall 2025)');
  const [savingGrades, setSavingGrades] = useState(false);
  const [gradeRoster, setGradeRoster] = useState([]);

  // Real Faculty List from Firestore
  const [facultyList, setFacultyList] = useState([]);
  const [facLoading, setFacLoading] = useState(false);

  // Faculty Profile & Assigned Multiple Course Codes
  const [facultyProfile, setFacultyProfile] = useState(null);
  const [facultySubjects, setFacultySubjects] = useState([]);

  useEffect(() => {
    if (currentUser) {
      loadEnrolledStudents();
      loadFaculty();
      loadFacultyProfile();
    }
  }, [currentUser]);

  async function loadFacultyProfile() {
    if (!currentUser?.email) return;
    try {
      const docRef = doc(db, 'faculty_members', currentUser.email.toLowerCase());
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setFacultyProfile(data);
        let subjects = [];
        if (Array.isArray(data.assignedSubjects) && data.assignedSubjects.length > 0) {
          subjects = data.assignedSubjects;
        } else if (typeof data.assignedSubject === 'string' && data.assignedSubject.trim()) {
          subjects = data.assignedSubject.split(',').map((s) => s.trim()).filter(Boolean);
        }
        if (subjects.length > 0) {
          setFacultySubjects(subjects);
          setSelectedSubject(subjects[0]);
        }
      }
    } catch (err) {
      console.warn('loadFacultyProfile warning:', err);
    }
  }

  async function loadEnrolledStudents() {
    setRosterLoading(true);
    try {
      const snap = await getDocs(collection(db, 'applications'));
      const students = [];
      const grades = [];
      snap.forEach((d) => {
        const data = d.data();
        const studentName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Enrolled Student';
        const studentEmail = (data.email || '').toLowerCase();
        if (studentEmail) {
          students.push({
            email: studentEmail,
            name: studentName,
            program: data.program || 'Computer Science',
            status: 'Present'
          });
          grades.push({
            email: studentEmail,
            name: studentName,
            code: 'CS101',
            subject: data.program || 'Degree Major',
            credits: 4,
            internal: 25,
            endterm: 60
          });
        }
      });
      setRollCall(students);
      setGradeRoster(grades);
    } catch (err) {
      console.warn('loadEnrolledStudents warning:', err);
    } finally {
      setRosterLoading(false);
    }
  }

  async function loadFaculty() {
    setFacLoading(true);
    try {
      const list = await getFacultyList();
      setFacultyList(list);
    } catch (err) {
      console.warn('loadFaculty warning:', err);
    } finally {
      setFacLoading(false);
    }
  }

  async function handleFacultyAuth(e) {
    e.preventDefault();
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      showToast('Welcome Faculty Member! Console unlocked.');
    } catch (err) {
      showToast('Faculty Login failed: ' + err.message.replace('Firebase: ', ''), 'error');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    await signOut(auth);
    showToast('Signed out of Faculty Console.');
  }

  function handleStatusToggle(idx, newStatus) {
    const updated = [...rollCall];
    updated[idx].status = newStatus;
    setRollCall(updated);
  }

  function handleMarkAllPresent() {
    setRollCall((prev) => prev.map((item) => ({ ...item, status: 'Present' })));
    showToast('All students marked Present.');
  }

  async function handleSaveAttendance() {
    if (!selectedSubject || !attendanceDate) {
      showToast('Please select subject and date.', 'error');
      return;
    }
    if (rollCall.length === 0) {
      showToast('No enrolled students found in database to mark attendance.', 'error');
      return;
    }
    setSavingAttendance(true);
    try {
      const code = selectedSubject.split(' - ')[0] || 'CS101';
      const name = selectedSubject.split(' - ')[1] || selectedSubject;
      const marker = currentUser?.email || 'Faculty';

      for (const item of rollCall) {
        await markCourseAttendance(item.email, code, name, attendanceDate, item.status, marker);
      }
      showToast(`Class attendance for ${rollCall.length} student(s) saved to Firestore!`);
    } catch (err) {
      showToast('Failed to save attendance: ' + err.message, 'error');
    } finally {
      setSavingAttendance(false);
    }
  }

  function handleGradeChange(idx, field, value) {
    const updated = [...gradeRoster];
    updated[idx][field] = Number(value);
    setGradeRoster(updated);
  }

  function calcGrade(total) {
    if (total >= 90) return 'A+';
    if (total >= 85) return 'A';
    if (total >= 80) return 'A-';
    if (total >= 75) return 'B+';
    if (total >= 70) return 'B';
    if (total >= 60) return 'C';
    return 'F';
  }

  async function handlePublishGrades() {
    if (gradeRoster.length === 0) {
      showToast('No students available in gradebook.', 'error');
      return;
    }
    setSavingGrades(true);
    try {
      for (const item of gradeRoster) {
        const total = (item.internal || 0) + (item.endterm || 0);
        const grade = calcGrade(total);
        const payload = {
          semester: gradeSemester,
          sgpa: '3.85 / 4.00',
          totalCredits: 20,
          status: 'Passed',
          subjects: [
            {
              code: item.code,
              name: item.subject,
              credits: item.credits,
              internalMarks: item.internal,
              endtermMarks: item.endterm,
              totalMarks: total,
              grade
            }
          ]
        };
        await saveStudentResults(item.email, payload);
      }
      showToast(`Published exam grades to student portals for ${gradeRoster.length} student(s)!`);
    } catch (err) {
      showToast('Failed to publish grades: ' + err.message, 'error');
    } finally {
      setSavingGrades(false);
    }
  }

  // STRICT AUTH GUARD: NO ACCESS WITHOUT LOGIN
  if (!currentUser) {
    return (
      <main className="max-w-md mx-auto px-4 py-16 w-full flex-grow">
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-2xl space-y-6 relative overflow-hidden text-center">
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/30">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Academic Faculty Portal
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 pt-1">Faculty &amp; Staff Login</h2>
            <p className="text-xs text-slate-500">Log in with your official university staff email to access roll call and gradebook</p>
          </div>

          <form onSubmit={handleFacultyAuth} className="space-y-4 text-left pt-2">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">Staff Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="faculty@apex.edu"
                className="w-full px-4 py-3.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-extrabold py-4 rounded-xl shadow-lg shadow-indigo-500/25 transition text-sm disabled:opacity-60 flex items-center justify-center gap-2 active:scale-95"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{authLoading ? 'Authenticating...' : 'Sign In to Faculty Console'}</span>
            </button>
          </form>
        </div>
      </main>
    );
  }

  // UNLOCKED FACULTY DASHBOARD
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full flex-grow space-y-8 animate-in fade-in">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 text-indigo-300 border border-indigo-400/40 flex items-center justify-center shadow-xl shrink-0">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                {facultyProfile?.name ? `${facultyProfile.name}` : 'Faculty & Academic Staff Console'}
              </h1>
              <span className="bg-emerald-400/20 text-emerald-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                {facultyProfile?.role || 'Staff Verified'}
              </span>
            </div>
            <p className="text-xs text-indigo-200/80 font-mono mt-0.5">{currentUser.email}</p>
            {facultySubjects.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] text-slate-400 font-bold self-center mr-1">Assigned Courses:</span>
                {facultySubjects.map((sub, idx) => (
                  <span key={idx} className="bg-indigo-500/25 text-indigo-200 text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg border border-indigo-400/30">
                    {sub}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <Link to="/portal" className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl border border-white/20 transition">
            Student Portal
          </Link>
          {isAdmin && (
            <Link to="/admin" className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl shadow-md transition">
              Admin Suite
            </Link>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white px-4 py-2.5 rounded-xl border border-rose-500/30 transition flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* FACULTY NAV TABS */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 overflow-x-auto">
        {[
          { key: 'attendance', label: 'Roll Call Attendance Marker', icon: <CheckCircle className="w-4 h-4" /> },
          { key: 'gradebook', label: 'Exam Marks & Gradebook', icon: <Award className="w-4 h-4" /> },
          { key: 'roster', label: 'Department Faculty Roster', icon: <Users className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-indigo-600 text-white shadow-md font-black'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: ATTENDANCE MARKER */}
      {activeTab === 'attendance' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Mark Lecture Roll Call</h2>
                <p className="text-xs text-slate-500 mt-1">Record student presence for course lectures and practical sessions.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadEnrolledStudents}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${rosterLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Roster</span>
                </button>
                <button
                  type="button"
                  onClick={handleMarkAllPresent}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-xs px-4 py-2.5 rounded-xl border border-emerald-200 transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Mark All Present</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">Select Course Subject *</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {facultySubjects.length > 0 ? (
                    facultySubjects.map((sub, idx) => (
                      <option key={idx} value={sub}>
                        {sub}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="CS101 - Data Structures & Algorithms">CS101 - Data Structures &amp; Algorithms</option>
                      <option value="CS102 - Artificial Intelligence & ML">CS102 - Artificial Intelligence &amp; ML</option>
                      <option value="CS103 - Database Management Systems">CS103 - Database Management Systems</option>
                      <option value="MATH201 - Discrete Mathematics">MATH201 - Discrete Mathematics</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">Lecture Date *</label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {rosterLoading ? (
              <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
                <span>Fetching student roster from Firestore...</span>
              </div>
            ) : rollCall.length === 0 ? (
              <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-2">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700 text-sm">No Enrolled Students Found</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  As students submit admission applications and create accounts, their names will automatically populate this roll call.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold text-[11px] border-b border-slate-200">
                      <th className="py-4 px-5">Student Email</th>
                      <th className="py-4 px-5">Student Name</th>
                      <th className="py-4 px-5 text-right">Attendance Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rollCall.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition">
                        <td className="py-4 px-5 font-mono font-bold text-indigo-600">{item.email}</td>
                        <td className="py-4 px-5 font-black text-slate-900">{item.name}</td>
                        <td className="py-4 px-5 text-right">
                          <div className="inline-flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                            {['Present', 'Absent', 'Late'].map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => handleStatusToggle(idx, st)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
                                  item.status === st
                                    ? st === 'Present'
                                      ? 'bg-emerald-600 text-white shadow-sm'
                                      : st === 'Absent'
                                      ? 'bg-rose-600 text-white shadow-sm'
                                      : 'bg-amber-500 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <button
              type="button"
              onClick={handleSaveAttendance}
              disabled={savingAttendance || rollCall.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm px-6 py-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{savingAttendance ? 'Saving Attendance...' : 'Save Class Roll Call to Firestore'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: EXAM MARKS & GRADEBOOK */}
      {activeTab === 'gradebook' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Faculty Gradebook &amp; Exam Controller</h2>
                <p className="text-xs text-slate-500 mt-1">Input internal continuous assessment and end-term marks to publish grades.</p>
              </div>
              <div className="w-full sm:w-auto">
                <select
                  value={gradeSemester}
                  onChange={(e) => setGradeSemester(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 focus:outline-none"
                >
                  <option value="Semester 1 (Fall 2025)">Semester 1 (Fall 2025)</option>
                  <option value="Semester 2 (Spring 2026)">Semester 2 (Spring 2026)</option>
                </select>
              </div>
            </div>

            {gradeRoster.length === 0 ? (
              <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-2">
                <Award className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700 text-sm">No Student Grade Roster Found</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Enrolled students will appear here automatically so you can enter internal test and final examination marks.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold text-[11px] border-b border-slate-200">
                      <th className="py-4 px-5">Student Name</th>
                      <th className="py-4 px-4">Subject</th>
                      <th className="py-4 px-4 text-center">Internal (/30)</th>
                      <th className="py-4 px-4 text-center">Endterm (/70)</th>
                      <th className="py-4 px-4 text-center">Total (/100)</th>
                      <th className="py-4 px-5 text-right">Auto Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {gradeRoster.map((item, idx) => {
                      const total = (item.internal || 0) + (item.endterm || 0);
                      const grade = calcGrade(total);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/70 transition">
                          <td className="py-4 px-5">
                            <p className="font-black text-slate-900">{item.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{item.email}</p>
                          </td>
                          <td className="py-4 px-4 font-semibold text-slate-700">{item.subject}</td>
                          <td className="py-4 px-4 text-center">
                            <input
                              type="number"
                              min="0"
                              max="30"
                              value={item.internal}
                              onChange={(e) => handleGradeChange(idx, 'internal', e.target.value)}
                              className="w-16 px-2 py-1.5 rounded-lg border border-slate-300 text-center font-bold text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                          </td>
                          <td className="py-4 px-4 text-center">
                            <input
                              type="number"
                              min="0"
                              max="70"
                              value={item.endterm}
                              onChange={(e) => handleGradeChange(idx, 'endterm', e.target.value)}
                              className="w-16 px-2 py-1.5 rounded-lg border border-slate-300 text-center font-bold text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                          </td>
                          <td className="py-4 px-4 text-center font-black text-slate-900">{total}</td>
                          <td className="py-4 px-5 text-right">
                            <span className="inline-block bg-indigo-50 text-indigo-700 font-black text-xs px-3 py-1 rounded-lg border border-indigo-200">
                              {grade}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <button
              type="button"
              onClick={handlePublishGrades}
              disabled={savingGrades || gradeRoster.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm px-6 py-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              <span>{savingGrades ? 'Publishing Grades...' : 'Publish Exam Grades to Student Portals'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: FACULTY ROSTER */}
      {activeTab === 'roster' && (
        <div className="space-y-6 animate-in fade-in">
          {facLoading ? (
            <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2 bg-white rounded-3xl border border-slate-200 p-8">
              <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
              <span>Loading faculty directory...</span>
            </div>
          ) : facultyList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200 p-8 space-y-2">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700 text-sm">No Faculty Records in Database</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Administrators can register new professors and academic staff in the Admin Suite under the Faculty Roster tab.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {facultyList.map((fac) => (
                <div key={fac.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 hover:shadow-lg transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                      {fac.department}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">{fac.role}</span>
                  </div>
                  <h3 className="font-black text-slate-900 text-lg">{fac.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{fac.email}</p>
                  <div className="pt-2 border-t border-slate-100 text-xs text-slate-700 font-semibold flex items-center gap-1.5 flex-wrap">
                    <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                    {Array.isArray(fac.assignedSubjects) && fac.assignedSubjects.length > 0 ? (
                      fac.assignedSubjects.map((s, idx) => (
                        <span key={idx} className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded text-[11px] border border-indigo-100">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span>{fac.assignedSubject || 'General Faculty'}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
