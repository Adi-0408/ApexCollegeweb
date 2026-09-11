import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  UserCheck,
  LogOut,
  Send,
  Calendar,
  Home,
  CheckCircle,
  FileCheck,
  Printer,
  AlertTriangle,
  User,
  Shield,
  HeartPulse,
  MapPin,
  Camera,
  Image as ImageIcon,
  X,
  Database,
  Edit3,
  GraduationCap,
  Clock,
  RotateCcw,
  Check,
  Sparkles,
  Video,
  Building2,
  ChevronRight,
  Phone,
  Mail,
  Award,
  ArrowRight,
  BarChart3,
  FileText,
  CalendarDays,
  Receipt,
  Percent,
  CheckCircle2,
  XCircle,
  Download,
  Search,
  BookOpen,
  ShieldCheck,
  Layers,
  Inbox
} from 'lucide-react';
import {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  collection,
  addDoc,
  updateDoc,
  setDoc,
  getDoc,
  doc,
  serverTimestamp,
  query,
  where,
  onSnapshot
} from '../lib/firebase.js';
import { getProgramsList, subscribePrograms } from '../lib/siteData.js';
import { sendApplicationSubmissionEmail } from '../lib/email.js';
import { useToast } from '../context/ToastContext.jsx';
import { ADMIN_EMAILS, DEFAULT_ADMIN_EMAILS, useAuth } from '../context/AuthContext.jsx';
import {
  getStudentAttendance,
  getStudentResults,
  getStudentTimetable,
  getStudentFees,
  checkStudentExamEligibility,
  getStudentHallTicket,
  submitRevaluationRequest
} from '../lib/academicData.js';

export default function PortalPage() {
  const { showToast } = useToast();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [currentUser, setCurrentUser] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [activeAppDocId, setActiveAppDocId] = useState(null);
  const [currentAppData, setCurrentAppData] = useState(null);
  const [appStatus, setAppStatus] = useState(null);
  const [rejectedPrograms, setRejectedPrograms] = useState([]);

  const [programs, setPrograms] = useState([]);

  // ERP Student Tabs: 'overview' | 'attendance' | 'results' | 'schedule' | 'fees'
  const [erpTab, setErpTab] = useState('overview');

  // Academic ERP Data (100% Real Firestore State)
  const [attendanceData, setAttendanceData] = useState([]);
  const [examResults, setExamResults] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [feeRecord, setFeeRecord] = useState(null);
  const [selectedSemIdx, setSelectedSemIdx] = useState(0);
  const [selectedDay, setSelectedDay] = useState('Monday');

  // Hall Ticket & Exam Eligibility States (Phase 4)
  const [examEligibility, setExamEligibility] = useState(null);
  const [hallTicket, setHallTicket] = useState(null);
  const [revaluationSubject, setRevaluationSubject] = useState(null);
  const [revaluationReason, setRevaluationReason] = useState('');
  const [submittingReval, setSubmittingReval] = useState(false);

  // Step 2 Appointment
  const [apptMode, setApptMode] = useState('In-Person (Campus Welcome Center)');
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('');
  const [apptLoading, setApptLoading] = useState(false);
  const [step2Done, setStep2Done] = useState(false);
  const [isEditingAppt, setIsEditingAppt] = useState(false);

  // Profile Section
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileDone, setProfileDone] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    preferredName: '',
    dob: '',
    gender: 'Male',
    nationality: 'United States',
    bloodGroup: 'O+',
    avatarUrl: '',
    phone: '',
    altPhone: '',
    addressStreet: '',
    addressCity: '',
    addressState: '',
    addressZip: '',
    addressCountry: 'United States',
    emergencyName: '',
    emergencyRelation: 'Parent',
    emergencyPhone: '',
    emergencyEmail: '',
    highSchool: '',
    gradYear: '2025',
    dietaryNeeds: 'None'
  });

  // Camera & File Upload States
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Step 4 Housing (Optional)
  const [housingHall, setHousingHall] = useState('Off-Campus / Not Required');
  const [housingRoom, setHousingRoom] = useState('Not Applicable');
  const [housingDining, setHousingDining] = useState('Not Applicable (Self-Catered)');
  const [housingLoading, setHousingLoading] = useState(false);
  const [step4Done, setStep4Done] = useState(false);

  // Admission form inputs
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [program, setProgram] = useState('');
  const [gpa, setGpa] = useState('');
  const [appLoading, setAppLoading] = useState(false);

  const appUnsubRef = useRef(null);
  const profileUnsubRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user && user.email) {
        const cleanEmail = user.email.toLowerCase();
        
        // 1. Check if user is Faculty member -> Redirect to Faculty Console
        try {
          const facSnap = await getDoc(doc(db, 'faculty_members', cleanEmail));
          if (facSnap.exists()) {
            navigate('/faculty', { replace: true });
            return;
          }
        } catch (err) {
          console.warn('Faculty check in PortalPage:', err);
        }

        // 2. Check if user is Primary Admin -> Redirect to Admin Suite
        if (ADMIN_EMAILS.includes(cleanEmail) || DEFAULT_ADMIN_EMAILS.includes(cleanEmail)) {
          if (sessionStorage.getItem('adminUnlocked') === 'true') {
            navigate('/admin');
            return;
          }
        }

        listenStudentData(user.email);
        listenProfileData(user.email);
        loadAcademicERP(user.email);
      } else {
        if (appUnsubRef.current) appUnsubRef.current();
        if (profileUnsubRef.current) profileUnsubRef.current();
        setActiveAppDocId(null);
        setCurrentAppData(null);
        setAppStatus(null);
      }
    });
    return () => {
      unsub();
      if (appUnsubRef.current) appUnsubRef.current();
      if (profileUnsubRef.current) profileUnsubRef.current();
      stopCamera();
    };
  }, [navigate]);

  useEffect(() => {
    async function loadProgs() {
      const progs = await getProgramsList();
      setPrograms(progs);
      const progParam = searchParams.get('program');
      if (progParam) setProgram(progParam);
    }
    loadProgs();
    const unsub = subscribePrograms((p) => setPrograms(p));
    return () => {
      if (unsub) unsub();
    };
  }, [searchParams]);

  useEffect(() => {
    if (isCameraOpen && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [isCameraOpen, cameraStream]);

  async function loadAcademicERP(userEmail) {
    if (!userEmail) return;
    try {
      const att = await getStudentAttendance(userEmail);
      setAttendanceData(att);
      const res = await getStudentResults(userEmail);
      setExamResults(res);
      const tt = await getStudentTimetable();
      setTimetable(tt);
      const fees = await getStudentFees(userEmail);
      setFeeRecord(fees);
      const elig = await checkStudentExamEligibility(userEmail);
      setExamEligibility(elig);
      const ht = await getStudentHallTicket(userEmail);
      setHallTicket(ht);
    } catch (err) {
      console.warn('loadAcademicERP error:', err);
    }
  }

  async function handleRevalSubmit(e) {
    e.preventDefault();
    if (!revaluationSubject || !revaluationReason.trim()) {
      showToast('Please specify a reason for revaluation.', 'error');
      return;
    }
    setSubmittingReval(true);
    try {
      await submitRevaluationRequest(
        currentUser.email,
        'Semester 1 (Fall 2025)',
        revaluationSubject,
        revaluationReason.trim()
      );
      showToast(`Revaluation request submitted for ${revaluationSubject}. An audit record has been created.`);
      setRevaluationSubject(null);
      setRevaluationReason('');
    } catch (err) {
      showToast('Failed to submit revaluation: ' + err.message, 'error');
    } finally {
      setSubmittingReval(false);
    }
  }

  // Listen to 'applications' collection
  function listenStudentData(userEmail) {
    if (appUnsubRef.current) appUnsubRef.current();
    const q = query(collection(db, 'applications'), where('email', '==', userEmail.toLowerCase()));
    appUnsubRef.current = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          setActiveAppDocId(null);
          setCurrentAppData(null);
          setAppStatus(null);
          setRejectedPrograms([]);
          return;
        }
        const rejected = [];
        snap.forEach((d) => {
          const data = d.data();
          const status = (data.status || 'Pending').toLowerCase();
          setActiveAppDocId(d.id);
          setCurrentAppData(data);
          setAppStatus(status);
          if (status === 'accepted') {
            setStep2Done(!!data.appointmentDate);
            setStep4Done(!!data.housingHall);
            if (data.appointmentDate) setApptDate(data.appointmentDate);
            if (data.appointmentTime) setApptTime(data.appointmentTime);
            if (data.appointmentMode) setApptMode(data.appointmentMode);

            if (data.housingHall) setHousingHall(data.housingHall);
            if (data.housingRoom) setHousingRoom(data.housingRoom);
            if (data.housingDining) setHousingDining(data.housingDining);

            setProfileData((prev) => ({
              ...prev,
              firstName: prev.firstName || data.firstName || '',
              lastName: prev.lastName || data.lastName || '',
              phone: prev.phone || data.phone || ''
            }));
          } else if (status === 'rejected') {
            rejected.push(data.program);
          }
        });
        setRejectedPrograms(rejected);
      },
      (err) => console.warn('listenStudentData error:', err)
    );
  }

  // Listen to 'profiles' collection
  function listenProfileData(userEmail) {
    if (profileUnsubRef.current) profileUnsubRef.current();
    const profileDocRef = doc(db, 'profiles', userEmail.toLowerCase());
    profileUnsubRef.current = onSnapshot(
      profileDocRef,
      (snap) => {
        if (snap.exists()) {
          const p = snap.data();
          setProfileData((prev) => ({
            ...prev,
            ...p
          }));
          if (p.profileCompleted || p.firstName) {
            setProfileDone(true);
          }
        }
      },
      (err) => console.warn('listenProfileData error:', err)
    );
  }

  // Camera & Photo Upload
  async function startCamera() {
    try {
      if (cameraStream) stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setCameraStream(stream);
      setIsCameraOpen(true);
    } catch (err) {
      showToast('Could not access camera: ' + err.message, 'error');
    }
  }

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 320;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setProfileData((prev) => ({ ...prev, avatarUrl: dataUrl }));
    stopCamera();
    showToast('Passport photo captured!');
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        showToast('Image size should be under 3MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const cvs = document.createElement('canvas');
          const maxDim = 400;
          let w = img.width;
          let h = img.height;
          if (w > h && w > maxDim) {
            h = (h * maxDim) / w;
            w = maxDim;
          } else if (h > maxDim) {
            w = (w * maxDim) / h;
            h = maxDim;
          }
          cvs.width = w;
          cvs.height = h;
          const ctx = cvs.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = cvs.toDataURL('image/jpeg', 0.85);
          setProfileData((prev) => ({ ...prev, avatarUrl: compressed }));
          showToast('Passport photo uploaded!');
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleAuth(e) {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        const cleanEmail = email.trim().toLowerCase();
        if (ADMIN_EMAILS.includes(cleanEmail) || DEFAULT_ADMIN_EMAILS.includes(cleanEmail)) {
          sessionStorage.setItem('adminUnlocked', 'true');
          showToast('Welcome Admin! Redirecting to admin console...');
          navigate('/admin');
          return;
        }
        showToast('Welcome back! Logged in successfully.');
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        showToast('Student account registered successfully!');
      }
    } catch (err) {
      showToast(err.message.replace('Firebase: ', ''), 'error');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    if (appUnsubRef.current) appUnsubRef.current();
    if (profileUnsubRef.current) profileUnsubRef.current();
    stopCamera();
    await signOut(auth);
    showToast('You have been logged out.');
  }

  async function handleAdmissionSubmit(e) {
    e.preventDefault();
    if (!currentUser || !currentUser.email) {
      showToast('You must be signed in to submit an application.', 'error');
      return;
    }
    if (!program) {
      showToast('Please select a degree program.', 'error');
      return;
    }
    setAppLoading(true);
    const applicantName = `${firstName.trim()} ${lastName.trim()}`;
    const selectedProgram = program.trim();
    const applicantEmail = currentUser.email.trim().toLowerCase();

    try {
      await addDoc(collection(db, 'applications'), {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: applicantEmail,
        phone: phone.trim(),
        program: selectedProgram,
        gpa: gpa.trim(),
        status: 'Pending',
        submittedAt: serverTimestamp(),
      });
      showToast('Application Submitted Successfully!');
      sendApplicationSubmissionEmail({
        to_email: applicantEmail,
        student_name: applicantName,
        program_name: selectedProgram,
      }).catch((err) => console.warn('EmailJS submission notice error:', err));
      setFirstName('');
      setLastName('');
      setPhone('');
      setGpa('');
    } catch (err) {
      console.error('Admission submit error:', err);
      showToast('Submission failed: ' + err.message.replace('Firebase: ', ''), 'error');
    } finally {
      setAppLoading(false);
    }
  }

  async function handleAppointmentSubmit(e) {
    e.preventDefault();
    if (!activeAppDocId) return;
    setApptLoading(true);
    try {
      await updateDoc(doc(db, 'applications', activeAppDocId), {
        appointmentMode: apptMode,
        appointmentDate: apptDate,
        appointmentTime: apptTime,
        appointmentStatus: 'Scheduled',
        appointmentSavedAt: serverTimestamp(),
      });
      showToast(`Appointment confirmed for ${apptDate} (${apptTime})!`);
      setStep2Done(true);
      setIsEditingAppt(false);
    } catch (err) {
      showToast('Failed to confirm appointment: ' + err.message, 'error');
    } finally {
      setApptLoading(false);
    }
  }

  async function handleMarkVisitComplete() {
    if (!activeAppDocId) return;
    try {
      await updateDoc(doc(db, 'applications', activeAppDocId), {
        appointmentStatus: 'Completed',
        appointmentCompletedAt: serverTimestamp(),
      });
      showToast('Document verification marked as completed!');
      setCurrentAppData((prev) => (prev ? { ...prev, appointmentStatus: 'Completed' } : null));
    } catch (err) {
      showToast('Failed to mark visit complete: ' + err.message, 'error');
    }
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    if (!currentUser) return;
    setProfileLoading(true);
    try {
      const docRef = doc(db, 'profiles', currentUser.email.toLowerCase());
      const payload = {
        ...profileData,
        email: currentUser.email.toLowerCase(),
        profileCompleted: true,
        updatedAt: serverTimestamp(),
      };
      await setDoc(docRef, payload, { merge: true });
      showToast('Personal Profile & Bio saved successfully!');
      setProfileDone(true);
      setIsEditingProfile(false);
    } catch (err) {
      showToast('Failed to save profile: ' + err.message, 'error');
    } finally {
      setProfileLoading(false);
    }
  }

  async function handleHousingSubmit(e) {
    e.preventDefault();
    if (!activeAppDocId) return;
    setHousingLoading(true);
    try {
      await updateDoc(doc(db, 'applications', activeAppDocId), {
        housingHall,
        housingRoom,
        housingDining,
        housingSavedAt: serverTimestamp(),
      });
      showToast(`Housing preferences saved for ${housingHall}!`);
      setStep4Done(true);
    } catch (err) {
      showToast('Failed to save housing: ' + err.message, 'error');
    } finally {
      setHousingLoading(false);
    }
  }

  async function handleSkipHousing() {
    if (!activeAppDocId) return;
    try {
      await updateDoc(doc(db, 'applications', activeAppDocId), {
        housingHall: 'Off-Campus / Not Required',
        housingRoom: 'Not Applicable',
        housingDining: 'Not Applicable (Self-Catered)',
      });
      showToast('Recorded off-campus housing status.');
      setHousingHall('Off-Campus / Not Required');
      setStep4Done(true);
    } catch (err) {
      showToast('Failed to record housing status: ' + err.message, 'error');
    }
  }

  function printAcceptanceLetter() {
    window.print();
  }

  const availablePrograms = programs.filter(
    (p) => !rejectedPrograms.some((r) => r.toLowerCase() === p.title.toLowerCase())
  );

  const showApplyForm = !appStatus || appStatus === 'rejected';
  const isVisitCompleted = currentAppData?.appointmentStatus === 'Completed';

  // Overall Attendance calculation
  const totalClassesSum = attendanceData.reduce((acc, curr) => acc + curr.totalClasses, 0);
  const attendedClassesSum = attendanceData.reduce((acc, curr) => acc + curr.attendedClasses, 0);
  const overallAttendancePct = totalClassesSum > 0 ? ((attendedClassesSum / totalClassesSum) * 100).toFixed(1) : '0.0';
  const lowAttendanceSubjects = attendanceData.filter((s) => s.percentage < 75);

  // STRICT AUTH GUARD: NO PORTAL ACCESS WITHOUT LOGIN
  if (!currentUser) {
    return (
      <main className="max-w-md mx-auto px-4 py-16 w-full flex-grow">
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-2xl space-y-6 relative overflow-hidden text-center">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-200">
            <UserCheck className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Student Academic ERP
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 pt-1">
              {isLogin ? 'Student Portal Login' : 'Create Student Account'}
            </h2>
            <p className="text-xs text-slate-500">
              {isLogin ? 'Access your application status, attendance, and exam results' : 'Register to submit your admission application'}
            </p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@apex.edu"
                className="w-full px-4 py-3.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition shadow-sm font-medium"
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
                className="w-full px-4 py-3.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition shadow-sm font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:scale-95 text-white font-extrabold py-4 rounded-xl shadow-lg shadow-indigo-500/25 text-sm transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {authLoading ? 'Processing...' : isLogin ? 'Sign In to Student Portal' : 'Register & Start Application'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
          <div className="pt-3 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => setIsLogin((l) => !l)}
              className="text-xs sm:text-sm text-indigo-600 font-bold hover:underline py-1"
            >
              {isLogin ? "Don't have an account yet? Register here" : 'Already have an account? Sign In'}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full flex-grow space-y-8">
      {/* ADMIN LOGGED IN NOTICE CARD */}
      {currentUser && currentUser.email && (ADMIN_EMAILS.includes(currentUser.email.toLowerCase()) || DEFAULT_ADMIN_EMAILS.includes(currentUser.email.toLowerCase())) ? (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6 animate-in fade-in">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black">Logged in as University Administrator</h2>
              <p className="text-xs text-indigo-200/80 mt-0.5 font-mono">{currentUser.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
            <Link
              to="/admin"
              className="flex-1 md:flex-initial text-center bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-6 py-3 rounded-xl text-xs shadow-lg transition"
            >
              Open Admin Console
            </Link>
            <Link
              to="/faculty"
              className="flex-1 md:flex-initial text-center bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold px-6 py-3 rounded-xl text-xs shadow-lg transition"
            >
              Open Faculty Console
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 md:flex-initial text-center bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white font-bold px-5 py-3 rounded-xl border border-rose-500/30 text-xs transition active:scale-95"
            >
              Sign Out
            </button>
          </div>
        </div>
      ) : (
        /* LOGGED IN STUDENT ERP PORTAL */
        <div className="space-y-8 sm:space-y-10 animate-in fade-in">
          {/* Executive Student Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-indigo-400/40 bg-slate-800 shadow-xl shrink-0 flex items-center justify-center">
                {profileData.avatarUrl ? (
                  <img src={profileData.avatarUrl} alt="Portrait" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-indigo-300" />
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-white">
                    {profileData.firstName || currentAppData?.firstName
                      ? `Welcome, ${profileData.firstName || currentAppData?.firstName}!`
                      : 'Student Academic ERP Portal'}
                  </h1>
                  <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
                </div>
                <p className="text-xs text-indigo-200/80 font-mono mt-0.5">{currentUser.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 relative z-10 flex-wrap">
              {activeAppDocId && (
                <span className="text-xs font-mono font-bold bg-white/10 text-indigo-200 px-3.5 py-2 rounded-xl border border-white/10 backdrop-blur-md">
                  ID: APX-2026-{String(activeAppDocId).slice(0, 6).toUpperCase()}
                </span>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs font-bold text-rose-300 hover:text-white bg-rose-500/20 hover:bg-rose-500/30 px-4 py-2.5 rounded-xl border border-rose-500/30 transition flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>

          {/* Student ERP Navigation Sub-Bar */}
          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 overflow-x-auto">
            {[
              { key: 'overview', label: 'Admission & Status', icon: <Layers className="w-4 h-4" /> },
              { key: 'attendance', label: 'Attendance Tracker', icon: <Percent className="w-4 h-4" />, badge: `${overallAttendancePct}%` },
              { key: 'results', label: 'Exam Results & Transcripts', icon: <Award className="w-4 h-4" /> },
              { key: 'hallticket', label: 'Exam Hall Ticket', icon: <GraduationCap className="w-4 h-4" />, badge: hallTicket ? 'Issued' : 'Check' },
              { key: 'schedule', label: 'Class Timetable', icon: <CalendarDays className="w-4 h-4" /> },
              { key: 'fees', label: 'Tuition Fees & Receipts', icon: <Receipt className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setErpTab(tab.key)}
                className={`flex items-center gap-2 px-4 sm:px-5 py-3 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  erpTab === tab.key
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 font-black'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      erpTab === tab.key ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* TAB 1: OVERVIEW & ADMISSIONS STATUS */}
          {erpTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in">
              {/* Status Summary Card */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-4">
                {!activeAppDocId ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">No Active Admission Application</h3>
                      <p className="text-xs text-slate-500 mt-1">Submit your academic background and desired degree to begin the enrollment review process.</p>
                    </div>
                    <a
                      href="#apply"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-md transition flex items-center gap-2"
                    >
                      <span>Complete Application Below ↓</span>
                    </a>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Undergraduate Degree Program</span>
                        <div className="flex flex-wrap items-center gap-2.5 mt-0.5">
                          <h3 className="text-xl font-black text-slate-900">{currentAppData?.program || 'Academic Degree'}</h3>
                          {(() => {
                            const pMatch = programs.find((p) =>
                              currentAppData?.program?.toLowerCase().includes(p.title.toLowerCase()) ||
                              p.title?.toLowerCase().includes(currentAppData?.program?.toLowerCase())
                            );
                            if (!pMatch) return null;
                            return (
                              <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                                ${Number(pMatch.price || 14500).toLocaleString()} / yr
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                      <div>
                        {appStatus === 'accepted' && (
                          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-black rounded-full border border-emerald-200 shadow-sm">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            <span>Offer Accepted</span>
                          </span>
                        )}
                        {appStatus === 'pending' && (
                          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-50 text-amber-800 text-xs font-black rounded-full border border-amber-200">
                            <Clock className="w-4 h-4 text-amber-600" />
                            <span>Under Admission Review</span>
                          </span>
                        )}
                        {appStatus === 'rejected' && (
                          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-rose-50 text-rose-800 text-xs font-black rounded-full border border-rose-200">
                            <AlertTriangle className="w-4 h-4 text-rose-600" />
                            <span>Application Rejected</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4 text-slate-400" />
                        <span><strong>Applicant:</strong> {profileData.firstName || currentAppData?.firstName} {profileData.lastName || currentAppData?.lastName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-slate-400" />
                        <span><strong>GPA / Score:</strong> {currentAppData?.gpa || 'N/A'}</span>
                      </div>
                      {currentAppData?.appointmentDate && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-indigo-600" />
                          <span className={`font-bold ${isVisitCompleted ? 'text-emerald-700' : 'text-indigo-700'}`}>
                            {isVisitCompleted ? 'Visit Verified ✓' : `${currentAppData.appointmentDate} (${currentAppData.appointmentTime})`}
                          </span>
                        </div>
                      )}
                      {profileDone && (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                          <Database className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Profile in Database ✓</span>
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* ONLINE ADMISSION APPLICATION FORM */}
              {showApplyForm && (
                <section id="apply" className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-10 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-3xl font-black text-slate-900">Online Admission Application</h2>
                      <p className="text-xs sm:text-sm text-slate-500">Please fill out all mandatory fields below</p>
                    </div>
                  </div>
                  <form onSubmit={handleAdmissionSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-2">First Name *</label>
                        <input
                          type="text"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Last Name *</label>
                        <input
                          type="text"
                          required
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Email Address *</label>
                        <input
                          type="email"
                          value={currentUser.email}
                          readOnly
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 font-bold text-sm cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Phone Number *</label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Select Degree Program *</label>
                      <select
                        required
                        value={program}
                        onChange={(e) => setProgram(e.target.value)}
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="">-- Choose Degree Program --</option>
                        {availablePrograms.map((p) => {
                          const fullTitle = p.fullTitle || `${p.degree ? p.degree + ' ' : ''}${p.title}`;
                          const priceStr = p.price ? `$${Number(p.price).toLocaleString()} / yr` : (p.priceDisplay || '$14,500 / yr');
                          return (
                            <option key={p.id} value={fullTitle}>
                              {fullTitle} — {priceStr}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Previous GPA / Score (%) *</label>
                      <input
                        type="text"
                        required
                        value={gpa}
                        onChange={(e) => setGpa(e.target.value)}
                        placeholder="e.g. 3.8 GPA or 88%"
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={appLoading}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold py-4 rounded-xl shadow-lg shadow-indigo-200 transition text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      <Send className="w-4 h-4" />
                      <span>{appLoading ? 'Submitting...' : 'Submit Admission Application'}</span>
                    </button>
                  </form>
                </section>
              )}
            </div>
          )}

          {/* TAB 2: LIVE ATTENDANCE TRACKER */}
          {erpTab === 'attendance' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <span className="bg-emerald-400/20 text-emerald-300 text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-400/30">
                    Live Academic Roll Call
                  </span>
                  <h2 className="text-xl sm:text-3xl font-black text-white">Course Attendance Summary</h2>
                  <p className="text-xs sm:text-sm text-indigo-200">
                    University policy requires maintaining at least <strong>75% attendance</strong> per course to sit for semester examinations.
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 text-center border border-white/15 shrink-0 w-full md:w-auto">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-200 block">Overall College Attendance</span>
                  <span className="text-3xl sm:text-4xl font-black text-emerald-400 block mt-1">{overallAttendancePct}%</span>
                  <span className="text-[10px] text-slate-300 block mt-1">{attendedClassesSum} / {totalClassesSum} Total Lectures Attended</span>
                </div>
              </div>

              {attendanceData.length === 0 ? (
                <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200 p-8 space-y-3 shadow-sm">
                  <Inbox className="w-10 h-10 text-indigo-300 mx-auto" />
                  <p className="font-black text-slate-800 text-base">No Class Attendance Records Yet</p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Once your course professors record daily lecture roll call in the Faculty Console, your live attendance percentages will update here automatically.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="font-black text-slate-900 text-base">Subject-wise Class Breakdown</h3>
                    <span className="text-xs text-slate-400 font-medium">Academic Term Records</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold text-[11px] border-b border-slate-200">
                          <th className="py-4 px-5">Subject Code</th>
                          <th className="py-4 px-5">Course Title</th>
                          <th className="py-4 px-4 text-center">Classes Attended</th>
                          <th className="py-4 px-4 text-center">Total Conducted</th>
                          <th className="py-4 px-4 text-center">Attendance %</th>
                          <th className="py-4 px-5 text-right">Academic Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {attendanceData.map((sub, i) => (
                          <tr key={i} className="hover:bg-slate-50/70 transition">
                            <td className="py-4 px-5 font-mono font-bold text-indigo-600">{sub.subjectCode}</td>
                            <td className="py-4 px-5 font-black text-slate-900">{sub.subjectName}</td>
                            <td className="py-4 px-4 text-center font-bold text-slate-900">{sub.attendedClasses}</td>
                            <td className="py-4 px-4 text-center text-slate-500 font-medium">{sub.totalClasses}</td>
                            <td className="py-4 px-4 text-center">
                              <span className={`font-black text-xs ${sub.percentage >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {sub.percentage}%
                              </span>
                            </td>
                            <td className="py-4 px-5 text-right font-bold">{sub.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EXAM RESULTS & MARKSHEET TRANSCRIPTS */}
          {erpTab === 'results' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">Academic Examination Marksheet</h2>
                  <p className="text-xs text-slate-500 mt-1">Official semester grade records and Cumulative Grade Point Average (CGPA).</p>
                </div>
                {examResults.length > 0 && (
                  <button
                    type="button"
                    onClick={printAcceptanceLetter}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Grade Card</span>
                  </button>
                )}
              </div>

              {examResults.length === 0 ? (
                <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200 p-8 space-y-3 shadow-sm">
                  <Award className="w-10 h-10 text-indigo-300 mx-auto" />
                  <p className="font-black text-slate-800 text-base">No Examination Results Published Yet</p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Official semester marksheets, SGPA/CGPA scores, and grade breakdown will be published here by the examination controller.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {examResults.map((sem, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedSemIdx(idx)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                          selectedSemIdx === idx
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {sem.semester}
                      </button>
                    ))}
                  </div>

                  {examResults[selectedSemIdx] && (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest">Semester Performance</span>
                          <h3 className="text-xl font-black text-slate-900 mt-0.5">{examResults[selectedSemIdx].semester}</h3>
                          <p className="text-xs text-emerald-700 font-bold mt-1">Status: {examResults[selectedSemIdx].status}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs text-center">
                          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">SGPA Score</span>
                          <strong className="text-2xl font-black text-indigo-600 block mt-0.5">{examResults[selectedSemIdx].sgpa}</strong>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold text-[11px] border-b border-slate-200">
                              <th className="py-4 px-5">Code</th>
                              <th className="py-4 px-5">Subject Name</th>
                              <th className="py-4 px-4 text-center">Credits</th>
                              <th className="py-4 px-4 text-center">Internal (/30)</th>
                              <th className="py-4 px-4 text-center">Endterm (/70)</th>
                              <th className="py-4 px-4 text-center">Total (/100)</th>
                              <th className="py-4 px-4 text-center">Letter Grade</th>
                              <th className="py-4 px-5 text-right">Audit Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {examResults[selectedSemIdx].subjects.map((sub, i) => (
                              <tr key={i} className="hover:bg-slate-50/70 transition">
                                <td className="py-4 px-5 font-mono font-bold text-indigo-600">{sub.code}</td>
                                <td className="py-4 px-5 font-black text-slate-900">{sub.name}</td>
                                <td className="py-4 px-4 text-center font-bold text-slate-700">{sub.credits}</td>
                                <td className="py-4 px-4 text-center text-slate-600">{sub.internalMarks}</td>
                                <td className="py-4 px-4 text-center text-slate-600">{sub.endtermMarks}</td>
                                <td className="py-4 px-4 text-center font-black text-slate-900">{sub.totalMarks}</td>
                                <td className="py-4 px-4 text-center">
                                  <span className="inline-block bg-indigo-50 text-indigo-700 font-black text-xs px-3 py-1 rounded-lg border border-indigo-200">
                                    {sub.grade}
                                  </span>
                                </td>
                                <td className="py-4 px-5 text-right">
                                  <button
                                    type="button"
                                    onClick={() => setRevaluationSubject(sub.code)}
                                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition"
                                  >
                                    Revaluation
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Revaluation Request Modal */}
              {revaluationSubject && (
                <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <h3 className="text-base font-black text-slate-900">Request Revaluation for {revaluationSubject}</h3>
                      <button onClick={() => setRevaluationSubject(null)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <form onSubmit={handleRevalSubmit} className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Grounds / Reason for Revaluation</label>
                        <textarea
                          required
                          rows={3}
                          value={revaluationReason}
                          onChange={(e) => setRevaluationReason(e.target.value)}
                          placeholder="State reasons for score re-verification..."
                          className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setRevaluationSubject(null)}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submittingReval}
                          className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          {submittingReval ? 'Submitting...' : 'Submit to Exam Cell'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: EXAM HALL TICKET & ADMIT CARD (Phase 4) */}
          {erpTab === 'hallticket' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 text-white p-6 sm:p-8 rounded-3xl border border-blue-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <span className="bg-blue-400/20 text-blue-300 text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-blue-400/30">
                    Exam Cell Admit Card
                  </span>
                  <h2 className="text-xl sm:text-3xl font-black text-white">Official Examination Hall Ticket</h2>
                  <p className="text-xs sm:text-sm text-blue-200">
                    Gated on maintaining minimum 75% attendance and zero outstanding tuition dues.
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 text-center border border-white/15 shrink-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-200 block">Verification Status</span>
                  <span className={`text-base font-black block mt-1 ${examEligibility?.eligible ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {examEligibility?.eligible ? 'Eligible for Finals ✓' : 'Eligibility Withheld'}
                  </span>
                </div>
              </div>

              {/* Eligibility Check Banners */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400">Attendance Requirement (&gt;=75%)</span>
                    <h4 className="text-xl font-black text-slate-900">{examEligibility?.attendancePercentage ?? overallAttendancePct}%</h4>
                    <p className={`text-xs font-bold mt-0.5 ${examEligibility?.attendancePassed !== false ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {examEligibility?.attendancePassed !== false ? 'Requirement Met ✓' : 'Short Attendance Alert'}
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${examEligibility?.attendancePassed !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    <Percent className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400">Tuition Financial Clearance</span>
                    <h4 className="text-xl font-black text-slate-900">{examEligibility?.feesPassed ? 'Cleared' : 'Dues Pending'}</h4>
                    <p className={`text-xs font-bold mt-0.5 ${examEligibility?.feesPassed ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {examEligibility?.feesPassed ? 'Zero Outstanding Balance ✓' : 'Clear balance with Accounts'}
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${examEligibility?.feesPassed ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    <Receipt className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Hall Ticket Card */}
              {!examEligibility?.eligible ? (
                <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center space-y-3">
                  <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto" />
                  <h3 className="font-black text-rose-900 text-lg">Examination Hall Ticket Withheld</h3>
                  <div className="text-xs text-rose-700 max-w-md mx-auto space-y-1">
                    {(examEligibility?.reasons || []).map((r, ri) => (
                      <p key={ri}>• {r}</p>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 pt-2">Please contact the HOD / Accounts department to resolve eligibility criteria.</p>
                </div>
              ) : !hallTicket ? (
                <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200 p-8 space-y-3 shadow-sm">
                  <GraduationCap className="w-10 h-10 text-blue-300 mx-auto" />
                  <p className="font-black text-slate-800 text-base">Eligibility Confirmed — Hall Ticket In Allocation</p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    You have satisfied all academic attendance and fee requirements. The Exam Cell is currently assigning examination seat numbers. Your official admit card will be visible here shortly.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border-2 border-indigo-600/30 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-6 gap-4">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                        Official Admit Card
                      </span>
                      <h3 className="text-2xl font-black text-slate-900 mt-2">Apex University — Examination Hall Ticket</h3>
                      <p className="text-xs text-slate-500">{hallTicket.session || 'Fall 2026 Final Examinations'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-md transition flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print / Download Admit Card</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Candidate Name</span>
                      <strong className="text-slate-900 text-sm block mt-0.5">{hallTicket.studentName || currentUser.email}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Allocated Seat No.</span>
                      <strong className="text-indigo-600 font-mono text-sm block mt-0.5">{hallTicket.seatNumber || 'APX-782190'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Exam Hall / Room</span>
                      <strong className="text-slate-900 text-sm block mt-0.5">{hallTicket.room || 'Main Hall A'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Session &amp; Timing</span>
                      <strong className="text-slate-900 text-sm block mt-0.5">09:30 AM - 12:30 PM</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-[11px] text-slate-500">
                    <span>Issued by: Controller of Examinations, Apex University</span>
                    <span className="font-mono text-indigo-700 font-bold">DIGITAL VERIFICATION SIGNATURE: VALID ✓</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CLASS TIMETABLE & ROUTINE */}
          {erpTab === 'schedule' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">Weekly Class Timetable</h2>
                    <p className="text-xs text-slate-500 mt-1">Live lecture schedules, room assignments, and faculty breakdown.</p>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setSelectedDay(day)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                          selectedDay === day
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {timetable.length === 0 ? (
                <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200 p-8 space-y-3 shadow-sm">
                  <CalendarDays className="w-10 h-10 text-indigo-300 mx-auto" />
                  <p className="font-black text-slate-800 text-base">No Timetable Uploaded Yet</p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Class timetables and daily room allocations will be published here by the academic department.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {timetable
                    .filter((t) => t.day.toLowerCase() === selectedDay.toLowerCase())
                    .map((item, idx) => (
                      <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:shadow-lg transition">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                            {item.type}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-indigo-600" />
                            {item.time}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 text-base">{item.subject}</h4>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>Room: <strong>{item.room}</strong></span>
                          </p>
                        </div>
                        <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>{item.faculty}</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: TUITION FEES & RECEIPTS */}
          {erpTab === 'fees' && (
            <div className="space-y-6 animate-in fade-in">
              {!feeRecord ? (
                <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200 p-8 space-y-3 shadow-sm">
                  <Receipt className="w-10 h-10 text-indigo-300 mx-auto" />
                  <p className="font-black text-slate-800 text-base">No Fee Records Found</p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Tuition fee clearances and verified payment receipts will appear here automatically upon enrollment verification.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400">Net Academic Tuition Fee</span>
                      <h3 className="text-3xl font-black text-slate-900">${feeRecord.netTuition}</h3>
                      <p className="text-xs text-slate-500 font-medium">Academic Year {feeRecord.academicYear}</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
                      <span className="text-[10px] font-extrabold uppercase text-emerald-600">Total Paid Amount</span>
                      <h3 className="text-3xl font-black text-emerald-600">${feeRecord.paidAmount}</h3>
                      <p className="text-xs text-emerald-600/80 font-bold">Status: {feeRecord.status}</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
                      <span className="text-[10px] font-extrabold uppercase text-indigo-600">Pending Dues</span>
                      <h3 className="text-3xl font-black text-indigo-600">${feeRecord.pendingDues}</h3>
                      <p className="text-xs text-slate-500 font-medium">No Outstanding Clearance Required</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                      <h3 className="font-black text-slate-900 text-base">Payment Receipt History</h3>
                      <span className="text-xs text-slate-400">Verified Financial Transactions</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold text-[11px] border-b border-slate-200">
                            <th className="py-4 px-5">Receipt Ref ID</th>
                            <th className="py-4 px-5">Date</th>
                            <th className="py-4 px-5">Payment Description</th>
                            <th className="py-4 px-4 text-center">Amount Paid</th>
                            <th className="py-4 px-5 text-right">Payment Method</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {feeRecord.transactions.map((txn, i) => (
                            <tr key={i} className="hover:bg-slate-50/70 transition">
                              <td className="py-4 px-5 font-mono font-bold text-indigo-600">{txn.id}</td>
                              <td className="py-4 px-5 font-medium text-slate-600">{txn.date}</td>
                              <td className="py-4 px-5 font-black text-slate-900">{txn.description}</td>
                              <td className="py-4 px-4 text-center font-black text-emerald-600">${txn.amount}</td>
                              <td className="py-4 px-5 text-right font-medium text-slate-600">{txn.method}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
