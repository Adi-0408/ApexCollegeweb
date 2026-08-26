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
  ArrowRight
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
  doc,
  serverTimestamp,
  query,
  where,
  onSnapshot
} from '../lib/firebase.js';
import { getProgramsList, subscribePrograms } from '../lib/siteData.js';
import { sendApplicationSubmissionEmail } from '../lib/email.js';
import { useToast } from '../context/ToastContext.jsx';
import { ADMIN_EMAILS } from '../context/AuthContext.jsx';

export default function PortalPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [currentUser, setCurrentUser] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [activeAppDocId, setActiveAppDocId] = useState(null);
  const [currentAppData, setCurrentAppData] = useState(null);
  const [appStatus, setAppStatus] = useState(null); // 'pending' | 'accepted' | 'rejected' | null
  const [rejectedPrograms, setRejectedPrograms] = useState([]);

  const [programs, setPrograms] = useState([]);

  // Step 2 Appointment
  const [apptMode, setApptMode] = useState('In-Person (Campus Welcome Center)');
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('');
  const [apptLoading, setApptLoading] = useState(false);
  const [step2Done, setStep2Done] = useState(false);
  const [isEditingAppt, setIsEditingAppt] = useState(false);

  // Profile Section (Personal Details - Saved separately in 'profiles' collection)
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

  // Camera & Gallery Upload States
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
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
          if (sessionStorage.getItem('adminUnlocked') === 'true') {
            navigate('/admin');
            return;
          }
        }
        listenStudentData(user.email);
        listenProfileData(user.email);
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

  // Listen to 'applications' collection
  function listenStudentData(userEmail) {
    if (appUnsubRef.current) appUnsubRef.current();
    const q = query(collection(db, 'applications'), where('email', '==', userEmail));
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

            // Baseline fallback for first/last name
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

  // Listen strictly to separate 'profiles' collection
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

  // Camera & File Upload Handlers
  async function startCamera() {
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false
      });
      setCameraStream(stream);
      setIsCameraOpen(true);
    } catch (err) {
      showToast('Camera access denied or unavailable: ' + err.message, 'error');
    }
  }

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  }

  async function capturePhoto() {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const size = Math.min(video.videoWidth, video.videoHeight) || 400;
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      const startX = (video.videoWidth - size) / 2 || 0;
      const startY = (video.videoHeight - size) / 2 || 0;
      ctx.drawImage(video, startX, startY, size, size, 0, 0, 400, 400);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      setProfileData((prev) => ({ ...prev, avatarUrl: dataUrl }));
      stopCamera();

      // Save strictly to separate 'profiles' collection
      if (currentUser?.email) {
        try {
          await setDoc(
            doc(db, 'profiles', currentUser.email.toLowerCase()),
            { avatarUrl: dataUrl, email: currentUser.email, updatedAt: serverTimestamp() },
            { merge: true }
          );
          showToast('Live photo captured & saved to profiles collection!');
        } catch (e) {
          showToast('Photo captured. Click Save Profile to persist.', 'error');
        }
      } else {
        showToast('Photo captured successfully!');
      }
    }
  }

  function handleGallerySelect(e) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const img = new Image();
          img.onload = async () => {
            const canvas = document.createElement('canvas');
            const maxDim = 400;
            let w = img.width;
            let h = img.height;
            if (w > h) {
              if (w > maxDim) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
              }
            } else {
              if (h > maxDim) {
                w = Math.round((w * maxDim) / h);
                h = maxDim;
              }
            }
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
            setProfileData((prev) => ({ ...prev, avatarUrl: compressedDataUrl }));

            // Save strictly to separate 'profiles' collection
            if (currentUser?.email) {
              try {
                await setDoc(
                  doc(db, 'profiles', currentUser.email.toLowerCase()),
                  { avatarUrl: compressedDataUrl, email: currentUser.email, updatedAt: serverTimestamp() },
                  { merge: true }
                );
                showToast('Gallery photo saved to profiles collection!');
              } catch (err) {
                showToast('Photo loaded. Click Save Profile to save to database.');
              }
            } else {
              showToast('Photo uploaded from gallery!');
            }
          };
          img.src = event.target.result;
        }
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
        if (email.trim().toLowerCase() === 'admin@apex.edu') {
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
    if (!currentUser) return;
    setAppLoading(true);
    const applicantName = `${firstName.trim()} ${lastName.trim()}`;
    const selectedProgram = program.trim();
    const applicantEmail = currentUser.email;

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
      showToast('Submission failed: ' + err.message, 'error');
    } finally {
      setAppLoading(false);
    }
  }

  // Step 2 Appointment Handlers
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
        visitCompletedAt: serverTimestamp(),
      });
      showToast('Verification visit marked as Complete! ✓');
    } catch (err) {
      showToast('Failed to update status: ' + err.message, 'error');
    }
  }

  // Save STRICTLY and SEPARATELY into the 'profiles' collection
  async function handleProfileSubmit(e) {
    e.preventDefault();
    if (!currentUser?.email) return;
    setProfileLoading(true);
    try {
      const profilePayload = {
        ...profileData,
        email: currentUser.email,
        applicationId: activeAppDocId || null,
        profileCompleted: true,
        updatedAt: serverTimestamp()
      };

      // Save strictly to 'profiles' collection
      await setDoc(doc(db, 'profiles', currentUser.email.toLowerCase()), profilePayload, { merge: true });

      // Mark milestone in application doc
      if (activeAppDocId) {
        await updateDoc(doc(db, 'applications', activeAppDocId), {
          profileCompleted: true
        });
      }

      showToast('Profile saved separately in "profiles" collection! ✓');
      setProfileDone(true);
      setIsEditingProfile(false);
    } catch (err) {
      showToast('Failed to save profile: ' + err.message, 'error');
    } finally {
      setProfileLoading(false);
    }
  }

  // Step 4 Housing (Optional)
  async function handleHousingSubmit(e) {
    if (e) e.preventDefault();
    if (!activeAppDocId) return;
    setHousingLoading(true);
    try {
      await updateDoc(doc(db, 'applications', activeAppDocId), {
        housingHall,
        housingRoom,
        housingDining,
        housingSavedAt: serverTimestamp(),
      });
      showToast(`Housing preferences saved (${housingHall}).`);
      setStep4Done(true);
    } catch (err) {
      showToast('Failed to save housing: ' + err.message, 'error');
    } finally {
      setHousingLoading(false);
    }
  }

  async function handleSkipHousing() {
    setHousingHall('Off-Campus / Commuter');
    setHousingRoom('Not Applicable');
    setHousingDining('Not Applicable');
    if (activeAppDocId) {
      await updateDoc(doc(db, 'applications', activeAppDocId), {
        housingHall: 'Off-Campus / Commuter',
        housingRoom: 'Not Applicable',
        housingDining: 'Not Applicable',
        housingSavedAt: serverTimestamp(),
      });
    }
    setStep4Done(true);
    showToast('Housing skipped (Off-Campus / Commuter selected).');
  }

  function printAcceptanceLetter() {
    const sName = currentAppData
      ? `${profileData.firstName || currentAppData.firstName} ${profileData.middleName ? profileData.middleName + ' ' : ''}${profileData.lastName || currentAppData.lastName}`
      : 'Student';
    const sProg = currentAppData ? currentAppData.program : 'Degree Program';
    const sId = activeAppDocId ? `APX-2026-${activeAppDocId.slice(0, 6).toUpperCase()}` : 'APX-2026-000000';
    const pWin = window.open('', '_blank');
    if (!pWin) return;
    pWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Apex University - Acceptance Letter</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #0f172a; line-height: 1.6; max-width: 800px; margin: auto; }
            .header { border-bottom: 3px solid #4f46e5; padding-bottom: 18px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-end; }
            .badge { display: inline-block; background: #ecfdf5; color: #047857; padding: 6px 14px; border-radius: 20px; font-weight: bold; font-size: 13px; border: 1px solid #a7f3d0; margin-bottom: 15px; }
            .details { margin: 20px 0; background: #f8fafc; padding: 18px; border-radius: 12px; border: 1px solid #e2e8f0; }
            .details table { width: 100%; border-collapse: collapse; }
            .details td { padding: 6px 0; font-size: 14px; }
            .footer { margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 15px; font-size: 12px; color: #64748b; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 style="color:#0f172a;margin:0;font-size:26px;letter-spacing:1px">APEX UNIVERSITY</h1>
              <p style="margin:0;color:#4f46e5;font-weight:bold;letter-spacing:1px;font-size:13px">OFFICE OF ADMISSIONS &amp; ENROLLMENT</p>
            </div>
            <div style="text-align:right;font-size:12px;color:#64748b">
              <p style="margin:0"><strong>Date:</strong> August 2026</p>
              <p style="margin:0"><strong>Student ID:</strong> ${sId}</p>
            </div>
          </div>
          <div>
            <span class="badge">OFFICIAL OFFER OF ADMISSION</span>
            <p style="margin-top:15px">Dear <strong>${sName}</strong>,</p>
            <p>Congratulations! We are pleased to inform you that you have been admitted for the <strong>Fall 2026 Academic Session</strong> into:</p>
            <div class="details">
              <table>
                <tr><td><strong>Academic Major:</strong></td><td>${sProg}</td></tr>
                <tr><td><strong>Degree Level:</strong></td><td>Undergraduate Degree</td></tr>
                <tr><td><strong>Enrollment Status:</strong></td><td>Full-Time Matriculated</td></tr>
                <tr><td><strong>Scholarship Award:</strong></td><td>$5,000 / Year (Merit Honors)</td></tr>
                ${profileData.nationality ? `<tr><td><strong>Citizenship:</strong></td><td>${profileData.nationality}</td></tr>` : ''}
              </table>
            </div>
            <p>Please log in to your Student Portal to complete your verification appointment and profile details.</p>
            <p style="margin-top:30px">Sincerely,<br><strong style="font-size:16px;color:#1e293b">Dr. Eleanor Vance</strong><br><span style="color:#64748b;font-size:13px">Dean of Admissions &amp; Student Affairs</span><br>Apex University</p>
          </div>
          <div class="footer">
            <p>100 University Blvd, Tech City, CA 94016 • Phone: +1 (800) 555-APEX • admissions@apex.edu</p>
          </div>
        </body>
      </html>
    `);
    pWin.document.close();
    pWin.focus();
    setTimeout(() => pWin.print(), 400);
  }

  const availablePrograms = programs.filter(
    (p) => !rejectedPrograms.includes(p.fullTitle || `${p.degree ? p.degree + ' ' : ''}${p.title}`)
  );
  const showApplyForm = !appStatus || appStatus === 'rejected';

  // Appointment Date Checking
  const todayStr = new Date().toISOString().split('T')[0];
  const isApptPassed = apptDate && apptDate < todayStr;
  const isVisitCompleted = currentAppData?.appointmentStatus === 'Completed';

  return (
    <main className="flex-grow w-full py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8 sm:space-y-12">
      {/* Hidden File Input for Gallery */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleGallerySelect}
        className="hidden"
      />

      {/* Hidden Canvas for Live Photo Capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Live Camera Studio Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 sm:p-6 animate-in fade-in">
          <div className="bg-slate-900 rounded-3xl overflow-hidden max-w-md w-full border border-slate-800 shadow-2xl space-y-4 p-5 sm:p-6 text-white text-center">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/30 flex items-center justify-center text-indigo-400">
                  <Camera className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-sm sm:text-base">Capture Live Student Photo</h3>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Viewfinder with Ring guide */}
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-950 border-2 border-indigo-500/40 shadow-inner flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              {/* Circular Face Alignment Ring */}
              <div className="absolute inset-8 border-2 border-dashed border-indigo-400/50 rounded-full pointer-events-none flex items-center justify-center">
                <span className="text-[10px] uppercase tracking-widest font-extrabold text-indigo-200 bg-slate-950/70 px-2.5 py-1 rounded-full backdrop-blur-md">
                  Center Face
                </span>
              </div>
            </div>

            {/* Shutter actions */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={stopCamera}
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 transition flex items-center gap-2 active:scale-95"
              >
                <Camera className="w-5 h-5" />
                <span>Snap &amp; Save Portrait</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUTHENTICATION VIEW (When Logged Out) */}
      {!currentUser && (
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-10 max-w-md mx-auto text-center space-y-6 my-6 sm:my-10 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/30">
            <UserCheck className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <span className="text-[11px] font-extrabold tracking-widest uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Student Admission Portal
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 pt-1">
              {isLogin ? 'Welcome to Apex' : 'Create Student Account'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {isLogin ? 'Sign in to access your enrollment roadmap & application status' : 'Register your email to apply for degree programs'}
            </p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4 text-left pt-2">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full px-4 py-3.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition shadow-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition shadow-sm"
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
          <div className="pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsLogin((l) => !l)}
              className="text-xs sm:text-sm text-indigo-600 font-bold hover:underline py-1"
            >
              {isLogin ? "Don't have an account yet? Register here" : 'Already have an account? Sign In'}
            </button>
          </div>
        </div>
      )}

      {/* DASHBOARD (When Logged In as Student) */}
      {currentUser && currentUser.email && ADMIN_EMAILS.includes(currentUser.email.toLowerCase()) ? (
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
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link
              to="/admin"
              className="flex-1 md:flex-initial text-center bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-6 py-3 rounded-xl text-xs shadow-lg transition"
            >
              Open Admin Console
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 md:flex-initial text-center bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white font-bold px-5 py-3 rounded-xl border border-rose-500/30 text-xs transition active:scale-95"
            >
              Sign Out of Admin
            </button>
          </div>
        </div>
      ) : currentUser ? (
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
                      : 'Student Admission Portal'}
                  </h1>
                  <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
                </div>
                <p className="text-xs text-indigo-200/80 font-mono mt-0.5">{currentUser.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 relative z-10 flex-wrap">
              {activeAppDocId && (
                <span className="text-xs font-mono font-bold bg-white/10 text-indigo-200 px-3.5 py-2 rounded-xl border border-white/10 backdrop-blur-md">
                  ID: APX-2026-{activeAppDocId.slice(0, 6).toUpperCase()}
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
                    <h3 className="text-xl font-black text-slate-900 mt-0.5">{currentAppData?.program || 'Academic Degree'}</h3>
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

          {/* ACCEPTED STUDENT ENROLLMENT ROADMAP */}
          {appStatus === 'accepted' && (
            <div className="space-y-8 sm:space-y-10">
              {/* Modern 4-Step Timeline Card */}
              <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden border border-indigo-500/20">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <span className="bg-emerald-400/20 text-emerald-300 text-[11px] font-extrabold uppercase tracking-widest px-3.5 py-1 rounded-full border border-emerald-400/30 inline-block">
                      Official Offer Extended
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white mt-1">Accepted Student Enrollment Roadmap</h2>
                    <p className="text-xs sm:text-sm text-indigo-200/90">
                      Complete your verification interview and personal profile to finalize matriculation.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={printAcceptanceLetter}
                    className="w-full sm:w-auto bg-white hover:bg-slate-100 active:scale-95 text-indigo-950 font-extrabold px-5 py-3 rounded-2xl text-xs sm:text-sm shadow-xl transition flex items-center justify-center gap-2 shrink-0"
                  >
                    <Printer className="w-4 h-4 text-indigo-600" />
                    <span>Download Offer Letter</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                  {[
                    { label: 'Application Submitted', done: true, num: '1', note: 'Completed' },
                    { label: 'Verification Slot', done: step2Done, num: '2', note: isVisitCompleted ? 'Verified ✓' : 'Required' },
                    { label: 'Personal Profile', done: profileDone, num: '3', note: 'Required' },
                    { label: 'Housing & Dining', done: step4Done, num: '4', note: 'Optional' },
                  ].map((step, i) => (
                    <div
                      key={i}
                      className={`backdrop-blur-md rounded-2xl p-3.5 border transition-all ${
                        step.done
                          ? 'bg-white/15 border-emerald-400/40 shadow-inner'
                          : 'bg-white/5 border-white/10 opacity-80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl font-black flex items-center justify-center text-xs shrink-0 shadow-md ${
                            step.done ? 'bg-emerald-400 text-indigo-950 font-black' : 'bg-indigo-600 text-white'
                          }`}
                        >
                          {step.done ? '✓' : step.num}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase font-extrabold text-indigo-200/90 truncate">
                            Step {i + 1} • <span className={step.note === 'Optional' ? 'text-amber-300 font-bold' : ''}>{step.note}</span>
                          </p>
                          <p className="text-xs font-black text-white truncate">{step.label}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* STEP 2: VERIFICATION APPOINTMENT */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base sm:text-lg font-black text-slate-900">Step 2: Verification Appointment (Mandatory)</h4>
                      <p className="text-xs sm:text-sm text-slate-500">Book your mandatory document review interview with admissions.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full border ${
                        isVisitCompleted
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : isApptPassed
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : step2Done
                          ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {isVisitCompleted
                        ? 'Visit Completed ✓'
                        : isApptPassed
                        ? 'Date Passed ⚠️'
                        : step2Done
                        ? 'Scheduled ✓'
                        : 'Action Required'}
                    </span>
                    {step2Done && !isEditingAppt && (
                      <button
                        type="button"
                        onClick={() => setIsEditingAppt(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-sm transition flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit / Reschedule</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* PASSED DATE ALERT */}
                {step2Done && isApptPassed && !isVisitCompleted && !isEditingAppt && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3 animate-in fade-in">
                    <div className="flex items-center gap-2 text-amber-900">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                      <h5 className="font-extrabold text-sm">Your scheduled verification appointment date ({apptDate}) has passed</h5>
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Please mark if your verification visit took place or reschedule a new appointment date:
                    </p>
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={handleMarkVisitComplete}
                        className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>Mark Visit Complete (Verified)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingAppt(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition flex items-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Reschedule to New Date</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* VIEW MODE: Confirmed Appointment Card */}
                {step2Done && !isEditingAppt ? (
                  <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 p-6 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Interview Mode</span>
                        <strong className="text-slate-900 text-sm flex items-center gap-1.5 mt-1">
                          {apptMode.includes('Virtual') ? <Video className="w-4 h-4 text-indigo-600" /> : <Building2 className="w-4 h-4 text-indigo-600" />}
                          <span>{apptMode}</span>
                        </strong>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Scheduled Date</span>
                        <strong className="text-slate-900 text-sm flex items-center gap-1.5 mt-1">
                          <Calendar className="w-4 h-4 text-indigo-600" />
                          <span>{apptDate}</span>
                        </strong>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Time Slot</span>
                        <strong className="text-slate-900 text-sm flex items-center gap-1.5 mt-1">
                          <Clock className="w-4 h-4 text-indigo-600" />
                          <span>{apptTime || '10:00 AM - 11:30 AM'}</span>
                        </strong>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 text-xs">
                      <span className="text-slate-500">
                        {isVisitCompleted ? (
                          <strong className="text-emerald-700 font-bold">✓ Official document review has been completed and verified.</strong>
                        ) : (
                          'Bring your official transcripts, government photo ID, and recommendation letters.'
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        {!isVisitCompleted && (
                          <button
                            type="button"
                            onClick={handleMarkVisitComplete}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Mark Visit Complete</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsEditingAppt(true)}
                          className="bg-white hover:bg-slate-100 text-slate-700 font-bold px-4 py-2 rounded-xl border border-slate-300 transition flex items-center gap-1.5 shadow-sm"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Reschedule Slot</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* EDIT / BOOKING FORM MODE */
                  <form onSubmit={handleAppointmentSubmit} className="space-y-6 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">Interview Mode *</label>
                        <select
                          value={apptMode}
                          onChange={(e) => setApptMode(e.target.value)}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        >
                          <option value="In-Person (Campus Welcome Center)">In-Person (Campus Welcome Center)</option>
                          <option value="Virtual (Zoom / Google Meet)">Virtual (Zoom / Google Meet)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">Appointment Date *</label>
                        <input
                          type="date"
                          value={apptDate}
                          onChange={(e) => setApptDate(e.target.value)}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">Time Slot *</label>
                        <select
                          value={apptTime}
                          onChange={(e) => setApptTime(e.target.value)}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        >
                          <option value="">-- Choose Slot --</option>
                          <option value="10:00 AM - 11:30 AM">10:00 AM - 11:30 AM (PST)</option>
                          <option value="01:30 PM - 03:00 PM">01:30 PM - 03:00 PM (PST)</option>
                          <option value="03:30 PM - 05:00 PM">03:30 PM - 05:00 PM (PST)</option>
                        </select>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
                      <span className="text-xs font-black uppercase text-slate-800">Prepare following documents for verification:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-600">
                        {[
                          'Official Academic Transcript & Certificates',
                          'Government Photo ID or Passport',
                          'Letters of Recommendation (x2)',
                          'Statement of Purpose / Project Portfolio'
                        ].map((docItem) => (
                          <label key={docItem} className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked disabled className="rounded text-indigo-600 w-4 h-4" />
                            <span>{docItem}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="submit"
                        disabled={apptLoading}
                        className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm px-6 py-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>{apptLoading ? 'Saving in Database...' : step2Done ? 'Update Appointment Schedule' : 'Confirm & Save Appointment Schedule'}</span>
                      </button>
                      {step2Done && (
                        <button
                          type="button"
                          onClick={() => setIsEditingAppt(false)}
                          className="bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs sm:text-sm px-6 py-4 rounded-xl transition"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>

              {/* STEP 3: PERSONAL PROFILE & DETAILS (VIEW & EDIT MODES) */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base sm:text-lg font-black text-slate-900">Step 3: Student Personal Profile &amp; Bio</h4>
                      <p className="text-xs sm:text-sm text-slate-500">Official student identity and emergency contact records saved in <strong className="text-indigo-600 font-bold">profiles</strong> collection.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full border ${
                        profileDone
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {profileDone ? 'Saved in profiles Collection ✓' : 'Action Required'}
                    </span>
                    {profileDone && !isEditingProfile && (
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-sm transition flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Profile</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* VIEW MODE: Saved Profile Overview Display */}
                {profileDone && !isEditingProfile ? (
                  <div className="space-y-6 animate-in fade-in">
                    {/* Header Card with Photo & Names */}
                    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 border border-slate-800 shadow-xl relative overflow-hidden">
                      <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
                      <div className="relative shrink-0">
                        {profileData.avatarUrl ? (
                          <img
                            src={profileData.avatarUrl}
                            alt="Student Portrait"
                            className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-white/20 shadow-2xl"
                          />
                        ) : (
                          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-slate-800 border-4 border-white/20 flex items-center justify-center text-slate-400 shadow-xl">
                            <User className="w-12 h-12" />
                          </div>
                        )}
                        <span className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg">
                          <CheckCircle className="w-4 h-4" />
                        </span>
                      </div>
                      <div className="space-y-2 text-center sm:text-left flex-grow">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                            {profileData.firstName} {profileData.middleName ? profileData.middleName + ' ' : ''}{profileData.lastName}
                          </h3>
                          {profileData.bloodGroup && (
                            <span className="bg-rose-500/20 text-rose-300 font-extrabold text-xs px-2.5 py-0.5 rounded-full border border-rose-500/40">
                              🩸 {profileData.bloodGroup}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-indigo-200">
                          {currentAppData?.program || 'Undergraduate Degree Program'}
                        </p>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-xs text-slate-300">
                          <span>🎂 <strong>DOB:</strong> {profileData.dob || 'N/A'}</span>
                          <span>🚻 <strong>Gender:</strong> {profileData.gender || 'N/A'}</span>
                          <span>🌐 <strong>Citizenship:</strong> {profileData.nationality || 'N/A'}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(true)}
                        className="bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 font-bold text-xs px-4 py-2.5 rounded-xl backdrop-blur-md transition flex items-center gap-1.5 shrink-0"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-indigo-300" />
                        <span>Edit Details</span>
                      </button>
                    </div>

                    {/* Detailed Data Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Contacts */}
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                        <span className="text-xs font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          <span>Contact &amp; Address</span>
                        </span>
                        <div className="space-y-1.5 text-xs text-slate-700">
                          <p><strong>Primary Phone:</strong> {profileData.phone || 'N/A'}</p>
                          {profileData.altPhone && <p><strong>Alt Phone:</strong> {profileData.altPhone}</p>}
                          <p><strong>Email:</strong> {currentUser.email}</p>
                          <div className="pt-2 border-t border-slate-200/60">
                            <span className="text-slate-500 font-semibold block">Residential Address:</span>
                            <span className="font-medium">{profileData.addressStreet || 'N/A'}</span>
                            <br />
                            <span className="text-slate-500">
                              {[profileData.addressCity, profileData.addressState, profileData.addressZip, profileData.addressCountry].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Emergency */}
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                        <span className="text-xs font-black uppercase text-rose-700 tracking-wider flex items-center gap-1.5">
                          <HeartPulse className="w-4 h-4" />
                          <span>Emergency Contact</span>
                        </span>
                        <div className="space-y-1.5 text-xs text-slate-700">
                          <p><strong>Name:</strong> {profileData.emergencyName || 'N/A'}</p>
                          <p><strong>Relationship:</strong> {profileData.emergencyRelation || 'Parent'}</p>
                          <p><strong>Phone:</strong> {profileData.emergencyPhone || 'N/A'}</p>
                          {profileData.emergencyEmail && <p><strong>Email:</strong> {profileData.emergencyEmail}</p>}
                        </div>
                      </div>

                      {/* Academic */}
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                        <span className="text-xs font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1.5">
                          <GraduationCap className="w-4 h-4" />
                          <span>Academic History</span>
                        </span>
                        <div className="space-y-1.5 text-xs text-slate-700">
                          <p><strong>High School / College:</strong> {profileData.highSchool || 'N/A'}</p>
                          <p><strong>Graduation Year:</strong> {profileData.gradYear || '2025'}</p>
                          <p><strong>Admitted Major:</strong> {currentAppData?.program || 'Undergraduate'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* EDIT / FILL FORM MODE (Live Camera & Gallery Only) */
                  <form onSubmit={handleProfileSubmit} className="space-y-8 animate-in fade-in">
                    {/* Photo & Identity Header */}
                    <div className="bg-slate-50/90 p-5 sm:p-6 rounded-2xl border border-slate-200 space-y-5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1.5">
                          <Camera className="w-4 h-4" />
                          <span>Student Photo (Live Camera or Gallery)</span>
                        </span>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Database className="w-3 h-3" />
                          <span>profiles/{currentUser.email}</span>
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-6">
                        {/* Avatar Preview */}
                        <div className="relative group shrink-0">
                          {profileData.avatarUrl ? (
                            <img
                              src={profileData.avatarUrl}
                              alt="Student Photo Preview"
                              className="w-28 h-28 rounded-3xl object-cover border-4 border-white shadow-xl ring-2 ring-indigo-500/30"
                            />
                          ) : (
                            <div className="w-28 h-28 rounded-3xl bg-slate-200 border-4 border-white shadow-xl flex flex-col items-center justify-center text-slate-400">
                              <User className="w-10 h-10 mb-1 text-slate-400" />
                              <span className="text-[10px] font-bold">No Photo</span>
                            </div>
                          )}
                          {profileData.avatarUrl && (
                            <span className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-1.5 rounded-full shadow-lg">
                              <CheckCircle className="w-4 h-4" />
                            </span>
                          )}
                        </div>

                        {/* Photo Upload & Camera Action Buttons */}
                        <div className="space-y-2 flex-grow w-full text-center sm:text-left">
                          <p className="text-xs text-slate-600 font-medium">
                            Upload a formal student headshot using your webcam or device photo gallery.
                          </p>
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1">
                            <button
                              type="button"
                              onClick={startCamera}
                              className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs px-4 py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2"
                            >
                              <Camera className="w-4 h-4" />
                              <span>Click Live Photo (Camera)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="bg-white hover:bg-slate-100 active:scale-95 text-slate-800 font-bold text-xs px-4 py-3 rounded-xl border border-slate-300 shadow-sm transition flex items-center justify-center gap-2"
                            >
                              <ImageIcon className="w-4 h-4 text-indigo-600" />
                              <span>Select from Gallery / Files</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section A: Legal Identity */}
                    <div className="space-y-4">
                      <span className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5 border-b pb-2">
                        <Shield className="w-4 h-4 text-indigo-600" />
                        <span>Legal Identity &amp; Bio Information</span>
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">First Name *</label>
                          <input
                            type="text"
                            required
                            value={profileData.firstName}
                            onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Middle Name</label>
                          <input
                            type="text"
                            value={profileData.middleName}
                            onChange={(e) => setProfileData({ ...profileData, middleName: e.target.value })}
                            placeholder="Optional"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Last Name *</label>
                          <input
                            type="text"
                            required
                            value={profileData.lastName}
                            onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Date of Birth *</label>
                          <input
                            type="date"
                            required
                            value={profileData.dob}
                            onChange={(e) => setProfileData({ ...profileData, dob: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Gender *</label>
                          <select
                            value={profileData.gender}
                            onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          >
                            <option>Male</option>
                            <option>Female</option>
                            <option>Non-Binary</option>
                            <option>Prefer not to say</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Citizenship *</label>
                          <input
                            type="text"
                            required
                            value={profileData.nationality}
                            onChange={(e) => setProfileData({ ...profileData, nationality: e.target.value })}
                            placeholder="e.g. United States"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Blood Group *</label>
                          <select
                            value={profileData.bloodGroup}
                            onChange={(e) => setProfileData({ ...profileData, bloodGroup: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          >
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                              <option key={bg} value={bg}>{bg}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Section B: Contact & Address */}
                    <div className="space-y-4">
                      <span className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5 border-b pb-2">
                        <MapPin className="w-4 h-4 text-indigo-600" />
                        <span>Permanent Residential Address &amp; Contact</span>
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Primary Phone *</label>
                          <input
                            type="tel"
                            required
                            value={profileData.phone}
                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Alternative Phone / WhatsApp</label>
                          <input
                            type="tel"
                            value={profileData.altPhone}
                            onChange={(e) => setProfileData({ ...profileData, altPhone: e.target.value })}
                            placeholder="+1 (555) 000-0000"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Street Address *</label>
                        <input
                          type="text"
                          required
                          value={profileData.addressStreet}
                          onChange={(e) => setProfileData({ ...profileData, addressStreet: e.target.value })}
                          placeholder="Apartment, suite, unit, building, floor, etc."
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">City *</label>
                          <input
                            type="text"
                            required
                            value={profileData.addressCity}
                            onChange={(e) => setProfileData({ ...profileData, addressCity: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">State / Province *</label>
                          <input
                            type="text"
                            required
                            value={profileData.addressState}
                            onChange={(e) => setProfileData({ ...profileData, addressState: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Postal Code *</label>
                          <input
                            type="text"
                            required
                            value={profileData.addressZip}
                            onChange={(e) => setProfileData({ ...profileData, addressZip: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Country *</label>
                          <input
                            type="text"
                            required
                            value={profileData.addressCountry}
                            onChange={(e) => setProfileData({ ...profileData, addressCountry: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section C: Emergency Contact */}
                    <div className="space-y-4">
                      <span className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5 border-b pb-2">
                        <HeartPulse className="w-4 h-4 text-rose-600" />
                        <span>Emergency &amp; Guardian Contact</span>
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contact Name *</label>
                          <input
                            type="text"
                            required
                            value={profileData.emergencyName}
                            onChange={(e) => setProfileData({ ...profileData, emergencyName: e.target.value })}
                            placeholder="Parent / Guardian Name"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Relationship *</label>
                          <select
                            value={profileData.emergencyRelation}
                            onChange={(e) => setProfileData({ ...profileData, emergencyRelation: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          >
                            <option>Parent</option>
                            <option>Guardian</option>
                            <option>Sibling</option>
                            <option>Spouse</option>
                            <option>Other Relative</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Emergency Phone *</label>
                          <input
                            type="tel"
                            required
                            value={profileData.emergencyPhone}
                            onChange={(e) => setProfileData({ ...profileData, emergencyPhone: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Emergency Email</label>
                          <input
                            type="email"
                            value={profileData.emergencyEmail}
                            onChange={(e) => setProfileData({ ...profileData, emergencyEmail: e.target.value })}
                            placeholder="guardian@example.com"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section D: Academic History */}
                    <div className="space-y-4">
                      <span className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5 border-b pb-2">
                        <GraduationCap className="w-4 h-4 text-indigo-600" />
                        <span>Academic Background</span>
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Previous High School / College Name</label>
                          <input
                            type="text"
                            value={profileData.highSchool}
                            onChange={(e) => setProfileData({ ...profileData, highSchool: e.target.value })}
                            placeholder="e.g. Westside Science Academy"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Graduation Year</label>
                          <input
                            type="text"
                            value={profileData.gradYear}
                            onChange={(e) => setProfileData({ ...profileData, gradYear: e.target.value })}
                            placeholder="2025"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="submit"
                        disabled={profileLoading}
                        className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm px-8 py-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        <Database className="w-4 h-4" />
                        <span>{profileLoading ? 'Saving in Database...' : 'Save & Update Profile Details'}</span>
                      </button>
                      {profileDone && (
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(false)}
                          className="bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs sm:text-sm px-6 py-4 rounded-xl transition"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>

              {/* STEP 4: HOUSING & DINING (OPTIONAL) */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
                      <Home className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base sm:text-lg font-black text-slate-900">Step 4: Campus Residence &amp; Dining</h4>
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                          Optional
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500">Optional: Select on-campus dormitory accommodation or skip if living off-campus.</p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-full border ${
                      step4Done
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {step4Done ? 'Saved ✓' : 'Optional'}
                  </span>
                </div>
                <form onSubmit={handleHousingSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">Residence Hall (Optional)</label>
                      <select
                        value={housingHall}
                        onChange={(e) => setHousingHall(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="Off-Campus / Not Required">Off-Campus / Commuter (Not Required)</option>
                        <option value="Apex Innovation Towers (Smart Tech Dorm)">Apex Innovation Towers (Smart Tech Dorm)</option>
                        <option value="East Campus Honors Suites">East Campus Honors Suites</option>
                        <option value="Eco-Pioneer Sustainable Residences">Eco-Pioneer Sustainable Residences</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">Room Type (Optional)</label>
                      <select
                        value={housingRoom}
                        onChange={(e) => setHousingRoom(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="Not Applicable">Not Applicable / Off-Campus</option>
                        <option value="Single Studio (En-suite bath)">Single Studio (En-suite bath)</option>
                        <option value="Double Shared Suite">Double Shared Suite</option>
                        <option value="4-Person Quad Suite">4-Person Quad Suite</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">Campus Dining Plan (Optional)</label>
                    <select
                      value={housingDining}
                      onChange={(e) => setHousingDining(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="Not Applicable (Self-Catered)">Not Applicable / Self-Catered</option>
                      <option value="Unlimited Chef Access Meal Plan (Recommended)">Unlimited Chef Access Meal Plan (Recommended)</option>
                      <option value="Flex 14 Meals / Week + $300 Dining Dollars">Flex 14 Meals / Week + $300 Dining Dollars</option>
                      <option value="Basic Commuter 50 Meals / Term">Basic Commuter 50 Meals / Term</option>
                    </select>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      disabled={housingLoading}
                      className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm px-6 py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{housingLoading ? 'Saving...' : 'Save Housing Preferences'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSkipHousing}
                      className="bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs sm:text-sm px-6 py-3.5 rounded-xl transition"
                    >
                      Skip / Living Off-Campus
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* APPLICATION FORM */}
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
              {rejectedPrograms.length > 0 && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-4 rounded-2xl font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Notice: Programs you were previously rejected from have been filtered from the dropdown below.</span>
                </p>
              )}
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
                      return (
                        <option key={p.id} value={fullTitle}>
                          {fullTitle}
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
      ) : null}
    </main>
  );
}
