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
  Sparkles
} from 'lucide-react';
import { auth, db, onAuthStateChanged, signOut, collection, getDocs, setDoc, doc, serverTimestamp } from '../lib/firebase.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { markCourseAttendance, saveStudentResults, DEFAULT_FACULTY } from '../lib/academicData.js';

export default function FacultyPage() {
  const { currentUser, isAdmin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' | 'gradebook' | 'roster'

  // Attendance Marker States
  const [selectedSubject, setSelectedSubject] = useState('CS102 - Artificial Intelligence & ML');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Student Roll Call List for Attendance
  const [rollCall, setRollCall] = useState([
    { email: 'adityapatil.4132@gmail.com', name: 'Aditya Patil', status: 'Present' },
    { email: 'student1@apex.edu', name: 'Alex Johnson', status: 'Present' },
    { email: 'student2@apex.edu', name: 'Emma Watson', status: 'Present' },
    { email: 'student3@apex.edu', name: 'Liam Neeson', status: 'Absent' },
    { email: 'student4@apex.edu', name: 'Sophia Martinez', status: 'Present' },
  ]);

  // Gradebook States
  const [gradeSemester, setGradeSemester] = useState('Semester 1 (Fall 2025)');
  const [savingGrades, setSavingGrades] = useState(false);
  const [gradeRoster, setGradeRoster] = useState([
    { email: 'adityapatil.4132@gmail.com', name: 'Aditya Patil', code: 'CS102', subject: 'Artificial Intelligence & ML', credits: 4, internal: 29, endterm: 66 },
    { email: 'student1@apex.edu', name: 'Alex Johnson', code: 'CS102', subject: 'Artificial Intelligence & ML', credits: 4, internal: 26, endterm: 60 },
    { email: 'student2@apex.edu', name: 'Emma Watson', code: 'CS102', subject: 'Artificial Intelligence & ML', credits: 4, internal: 28, endterm: 64 },
    { email: 'student3@apex.edu', name: 'Liam Neeson', code: 'CS102', subject: 'Artificial Intelligence & ML', credits: 4, internal: 20, endterm: 45 },
  ]);

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
    setSavingAttendance(true);
    try {
      const code = selectedSubject.split(' - ')[0] || 'CS101';
      const name = selectedSubject.split(' - ')[1] || selectedSubject;
      const marker = currentUser?.email || 'Faculty';

      for (const item of rollCall) {
        await markCourseAttendance(item.email, code, name, attendanceDate, item.status, marker);
      }
      showToast(`Class attendance for ${rollCall.length} students saved successfully!`);
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
      showToast(`Published grades to student portals for ${gradeRoster.length} students!`);
    } catch (err) {
      showToast('Failed to publish grades: ' + err.message, 'error');
    } finally {
      setSavingGrades(false);
    }
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full flex-grow space-y-8">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 text-indigo-300 border border-indigo-400/40 flex items-center justify-center shadow-xl shrink-0">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">Faculty &amp; Academic Staff Console</h1>
              <span className="bg-emerald-400/20 text-emerald-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                Staff Verified
              </span>
            </div>
            <p className="text-xs text-indigo-200/80 font-mono mt-0.5">{currentUser?.email || 'Faculty Account'}</p>
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
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-xs px-4 py-2.5 rounded-xl border border-emerald-200 transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Mark All Present</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">Select Course Subject *</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="CS101 - Data Structures & Algorithms">CS101 - Data Structures &amp; Algorithms</option>
                  <option value="CS102 - Artificial Intelligence & ML">CS102 - Artificial Intelligence &amp; ML</option>
                  <option value="CS103 - Database Management Systems">CS103 - Database Management Systems</option>
                  <option value="MATH201 - Discrete Mathematics">MATH201 - Discrete Mathematics</option>
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

            <button
              type="button"
              onClick={handleSaveAttendance}
              disabled={savingAttendance}
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

            <button
              type="button"
              onClick={handlePublishGrades}
              disabled={savingGrades}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {DEFAULT_FACULTY.map((fac) => (
              <div key={fac.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                    {fac.department}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">{fac.role}</span>
                </div>
                <h3 className="font-black text-slate-900 text-lg">{fac.name}</h3>
                <p className="text-xs text-slate-500 font-mono">{fac.email}</p>
                <div className="pt-2 border-t border-slate-100 text-xs text-slate-700 font-semibold flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>{fac.assignedSubject}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
