import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Eye,
  LogOut,
  Users,
  BookOpen,
  LayoutTemplate,
  RefreshCw,
  PlusCircle,
  Edit3,
  Trash2,
  Check,
  Image,
  BarChart2,
  PhoneCall,
  Compass,
  Plus,
  X,
  User,
  MapPin,
  HeartPulse,
  GraduationCap,
  Calendar,
  Clock,
  Search,
  CheckCircle,
  AlertTriangle,
  Building2,
  Sparkles,
  Phone,
  Mail,
  Award,
  CalendarDays,
  Video,
  ChevronDown,
  Home,
  CheckCircle2,
  Shield
} from 'lucide-react';
import {
  auth,
  db,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  collection,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy
} from '../lib/firebase.js';
import {
  getSiteContent,
  saveSiteContent,
  getProgramsList,
  saveProgram,
  deleteProgram,
  DEFAULT_SITE_CONTENT
} from '../lib/siteData.js';
import { sendApplicationStatusEmail } from '../lib/email.js';
import { useToast } from '../context/ToastContext.jsx';
import { ADMIN_EMAILS } from '../context/AuthContext.jsx';

export default function AdminPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [unlocked, setUnlocked] = useState(false);
  const [adminEmail, setAdminEmail] = useState('adityapatil.4132@gmail.com');
  const [adminPass, setAdminPass] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('applications');

  // Applications
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appSearch, setAppSearch] = useState('');
  const [appFilter, setAppFilter] = useState('all');
  const [selectedStudentProfile, setSelectedStudentProfile] = useState(null);
  const appsCache = useRef({});

  // Programs
  const [programs, setPrograms] = useState([]);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [editProgId, setEditProgId] = useState(null);
  const [progTitle, setProgTitle] = useState('');
  const [progDegree, setProgDegree] = useState('B.S. Degree');
  const [progDuration, setProgDuration] = useState('4 Years');
  const [progImage, setProgImage] = useState('');
  const [progDesc, setProgDesc] = useState('');
  const [progSaving, setProgSaving] = useState(false);

  // CMS
  const [cmsData, setCmsData] = useState(null);
  const [cmsSaving, setCmsSaving] = useState(false);
  const [facilities, setFacilities] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (
        user &&
        user.email &&
        ADMIN_EMAILS.includes(user.email.toLowerCase()) &&
        sessionStorage.getItem('adminUnlocked') === 'true'
      ) {
        setUnlocked(true);
        loadAdminData();
      } else {
        setUnlocked(false);
      }
    });
    return unsub;
  }, []);

  async function handleAdminLogin(e) {
    e.preventDefault();
    setLoginLoading(true);
    try {
      await signInWithEmailAndPassword(auth, adminEmail.trim(), adminPass);
      if (ADMIN_EMAILS.includes(adminEmail.trim().toLowerCase())) {
        sessionStorage.setItem('adminUnlocked', 'true');
        setUnlocked(true);
        loadAdminData();
        showToast('Welcome Admin! Dashboard unlocked.');
      } else {
        showToast('Access Denied: Not an admin account.', 'error');
      }
    } catch (err) {
      showToast('Invalid admin credentials: ' + err.message.replace('Firebase: ', ''), 'error');
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleLogout() {
    sessionStorage.removeItem('adminUnlocked');
    setUnlocked(false);
    setAdminPass('');
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Sign out error:', err);
    }
    showToast('Logged out from admin console.');
    navigate('/');
  }

  async function loadAdminData() {
    loadApplications();
    loadPrograms();
    loadCms();
  }

  async function loadApplications() {
    setAppsLoading(true);
    try {
      const q = query(collection(db, 'applications'), orderBy('submittedAt', 'desc'));
      const snap = await getDocs(q);
      const list = [];
      snap.forEach((d) => {
        appsCache.current[d.id] = d.data();
        list.push({ id: d.id, ...d.data() });
      });
      setApplications(list);
    } catch (err) {
      try {
        const snap = await getDocs(collection(db, 'applications'));
        const list = [];
        snap.forEach((d) => {
          appsCache.current[d.id] = d.data();
          list.push({ id: d.id, ...d.data() });
        });
        setApplications(list);
      } catch (fallbackErr) {
        showToast('Failed to load applications: ' + err.message, 'error');
      }
    } finally {
      setAppsLoading(false);
    }
  }

  async function updateStatus(docId, newStatus) {
    try {
      await updateDoc(doc(db, 'applications', docId), { status: newStatus });
      const appData = appsCache.current[docId];
      if (appData && appData.email) {
        const studentName = `${appData.firstName || ''} ${appData.lastName || ''}`.trim() || 'Applicant';
        sendApplicationStatusEmail({
          to_email: appData.email,
          student_name: studentName,
          program_name: appData.program || '',
          status: newStatus,
        }).then((res) => {
          if (res.success) {
            showToast(`Application marked as ${newStatus}! Email sent to ${appData.email}.`);
          } else {
            console.warn('Email send notice:', res.error);
            showToast(`Application marked as ${newStatus}! (Email note: ${res.error})`);
          }
        });
      } else {
        showToast(`Application marked as ${newStatus}!`);
      }
      if (selectedStudentProfile && selectedStudentProfile.id === docId) {
        setSelectedStudentProfile((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      loadApplications();
    } catch (err) {
      showToast('Failed to update status: ' + err.message, 'error');
    }
  }

  async function loadPrograms() {
    const progs = await getProgramsList();
    setPrograms(progs);
  }

  function openAddModal() {
    setEditProgId(null);
    setProgTitle('');
    setProgDegree('B.S. Degree');
    setProgDuration('4 Years');
    setProgImage('');
    setProgDesc('');
    setShowProgramModal(true);
  }

  function openEditModal(p) {
    setEditProgId(p.id);
    setProgTitle(p.title || '');
    setProgDegree(p.degree || '');
    setProgDuration(p.duration || '4 Years');
    setProgImage(p.image || '');
    setProgDesc(p.description || '');
    setShowProgramModal(true);
  }

  async function handleProgSave(e) {
    e.preventDefault();
    setProgSaving(true);
    try {
      const data = {
        title: progTitle,
        degree: progDegree,
        fullTitle: `${progDegree} ${progTitle}`,
        duration: progDuration,
        image: progImage,
        description: progDesc,
        active: true,
      };
      await saveProgram(data, editProgId || null);
      await loadPrograms();
      setShowProgramModal(false);
      showToast(editProgId ? 'Program updated!' : 'Program added!');
    } catch (err) {
      showToast('Failed to save program: ' + err.message, 'error');
    } finally {
      setProgSaving(false);
    }
  }

  async function handleDeleteProg(id) {
    if (!confirm('Are you sure you want to delete this program?')) return;
    try {
      await deleteProgram(id);
      await loadPrograms();
      showToast('Program deleted.');
    } catch (err) {
      showToast('Failed to delete program: ' + err.message, 'error');
    }
  }

  async function loadCms() {
    const site = await getSiteContent();
    setCmsData(site);
    setFacilities(site.facilities || []);
  }

  async function handleCmsSave(e) {
    e.preventDefault();
    setCmsSaving(true);
    const fd = new FormData(e.target);
    const stats = [0, 1, 2, 3].map((i) => ({
      value: fd.get(`stat-val-${i}`) || '',
      label: fd.get(`stat-lbl-${i}`) || '',
    }));
    const newContent = {
      ...cmsData,
      brandName: fd.get('brandName'),
      brandNameSuffix: fd.get('brandNameSuffix'),
      brandTagline: fd.get('brandTagline'),
      heroBadge: fd.get('heroBadge'),
      heroTitle: fd.get('heroTitle'),
      heroTitleHighlight: fd.get('heroTitleHighlight'),
      heroSubtitle: fd.get('heroSubtitle'),
      heroImage: fd.get('heroImage'),
      stats,
      facilities,
      contactEmail: fd.get('contactEmail'),
      contactPhone: fd.get('contactPhone'),
      contactAddress: fd.get('contactAddress'),
    };
    try {
      await saveSiteContent(newContent);
      showToast('Website content saved successfully!');
    } catch (err) {
      showToast('Save failed: ' + err.message, 'error');
    } finally {
      setCmsSaving(false);
    }
  }

  function updateFacility(idx, field, val) {
    setFacilities((prev) => prev.map((f, i) => (i === idx ? { ...f, [field]: val } : f)));
  }

  function addFacility() {
    setFacilities((prev) => [
      ...prev,
      {
        id: `fac_${Date.now()}`,
        title: '',
        category: 'Academic',
        description: '',
        image: '',
        videoUrl: 'https://www.youtube.com',
        tags: [],
      },
    ]);
  }

  function removeFacility(idx) {
    setFacilities((prev) => prev.filter((_, i) => i !== idx));
  }

  async function openStudentProfile(app) {
    let combinedData = { ...app };
    if (app.email) {
      try {
        const snap = await getDoc(doc(db, 'profiles', app.email.toLowerCase()));
        if (snap.exists()) {
          combinedData = { ...combinedData, ...snap.data() };
        }
      } catch (err) {
        console.warn('Failed to fetch from profiles collection:', err);
      }
    }
    setSelectedStudentProfile(combinedData);
  }

  const filteredApplications = applications.filter((app) => {
    let match = true;
    const status = (app.status || 'pending').toLowerCase();
    if (appFilter !== 'all' && status !== appFilter.toLowerCase()) {
      match = false;
    }
    if (match && appSearch.trim()) {
      const q = appSearch.toLowerCase();
      const name = `${app.firstName || ''} ${app.lastName || ''}`.toLowerCase();
      const email = (app.email || '').toLowerCase();
      const prog = (app.program || '').toLowerCase();
      match = name.includes(q) || email.includes(q) || prog.includes(q);
    }
    return match;
  });

  const totalAppsCount = applications.length;
  const acceptedCount = applications.filter((a) => (a.status || '').toLowerCase() === 'accepted').length;
  const pendingCount = applications.filter((a) => !a.status || a.status.toLowerCase() === 'pending').length;
  const rejectedCount = applications.filter((a) => (a.status || '').toLowerCase() === 'rejected').length;
  const programsCount = programs.length;

  const tabs = [
    { key: 'applications', label: 'Candidate Admissions', icon: <Users className="w-4 h-4" />, count: totalAppsCount },
    { key: 'programs', label: 'Degree Majors', icon: <BookOpen className="w-4 h-4" />, count: programsCount },
    { key: 'cms', label: 'Website CMS', icon: <LayoutTemplate className="w-4 h-4" /> },
  ];

  // Helper to split program string nicely
  function parseProgramDisplay(progStr = '') {
    if (!progStr) return { badge: 'Degree', title: 'General Studies' };
    const parts = progStr.split(' ');
    if (parts[0].includes('.')) {
      return {
        badge: parts[0],
        title: parts.slice(1).join(' ')
      };
    }
    return {
      badge: 'Major',
      title: progStr
    };
  }

  // LOGIN SCREEN FOR ADMIN
  if (!unlocked) {
    return (
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full flex items-center justify-center">
        <div className="max-w-md w-full bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-2xl text-center space-y-6 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/30">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Administrative Control
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 pt-1">Executive Console</h2>
            <p className="text-xs text-slate-500">Sign in with university administrator credentials</p>
          </div>
          <form onSubmit={handleAdminLogin} className="space-y-4 text-left pt-2">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">Admin Email</label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition shadow-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">Security Password</label>
              <input
                type="password"
                required
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition shadow-sm font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-extrabold py-4 rounded-xl shadow-lg shadow-indigo-500/25 transition text-sm disabled:opacity-60 flex items-center justify-center gap-2 active:scale-95"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loginLoading ? 'Authenticating...' : 'Unlock Administrative Console'}</span>
            </button>
          </form>
        </div>
      </main>
    );
  }

  // UNLOCKED ADMIN DASHBOARD
  return (
    <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 w-full flex-grow space-y-6 sm:space-y-8 animate-in fade-in">
      {/* Executive Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-5 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3.5 sm:gap-4 relative z-10">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
            <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-3xl font-black text-white">Admin Suite</h1>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/30 uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-indigo-200/80 mt-0.5 font-medium">
              Review applicant portfolios, manage catalog, and update CMS content.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 relative z-10 w-full md:w-auto">
          <Link
            to="/"
            target="_blank"
            className="flex-1 md:flex-initial text-center bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition border border-white/15 backdrop-blur-md flex items-center justify-center gap-1.5"
          >
            <Eye className="w-4 h-4 text-indigo-300" />
            <span>Public Site</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex-1 md:flex-initial text-center bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-rose-500/30 transition flex items-center justify-center gap-1.5 active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>Lock &amp; Exit</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Apps</span>
            <h3 className="text-xl sm:text-3xl font-black text-slate-900">{totalAppsCount}</h3>
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">Submissions</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 text-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">Accepted</span>
            <h3 className="text-xl sm:text-3xl font-black text-emerald-600">{acceptedCount}</h3>
            <p className="text-[10px] sm:text-[11px] text-emerald-600/80 font-medium truncate">Enrolled</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 text-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600">Pending</span>
            <h3 className="text-xl sm:text-3xl font-black text-amber-600">{pendingCount}</h3>
            <p className="text-[10px] sm:text-[11px] text-amber-600/80 font-medium truncate">In Review</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-50 text-amber-600 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">Majors</span>
            <h3 className="text-xl sm:text-3xl font-black text-indigo-600">{programsCount}</h3>
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">In Catalog</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 text-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white p-1.5 sm:p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1.5 sm:gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 font-black'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: APPLICATIONS & CANDIDATES */}
      {activeTab === 'applications' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header & Filter Controls */}
            <div className="p-4 sm:p-6 bg-gradient-to-b from-slate-50/90 to-white border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80">
                {[
                  { key: 'all', label: 'All Candidates', count: totalAppsCount },
                  { key: 'pending', label: 'Pending', count: pendingCount },
                  { key: 'accepted', label: 'Accepted', count: acceptedCount },
                  { key: 'rejected', label: 'Rejected', count: rejectedCount },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setAppFilter(f.key)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                      appFilter === f.key
                        ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <span>{f.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                        appFilter === f.key ? 'bg-indigo-50 text-indigo-700 font-black' : 'bg-slate-200/70 text-slate-600'
                      }`}
                    >
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search & Actions Bar */}
              <div className="flex items-center gap-2.5 w-full md:w-auto">
                <div className="relative flex-grow md:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={appSearch}
                    onChange={(e) => setAppSearch(e.target.value)}
                    placeholder="Search name, email, major..."
                    className="w-full pl-9 pr-8 py-2.5 bg-white rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs font-medium"
                  />
                  {appSearch && (
                    <button
                      onClick={() => setAppSearch('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={loadApplications}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 p-2.5 rounded-xl transition shadow-2xs shrink-0 flex items-center gap-1 text-xs font-bold"
                  title="Reload candidate table"
                >
                  <RefreshCw className={`w-4 h-4 text-indigo-600 ${appsLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* MOBILE CANDIDATE CARDS (Visible on small screens) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {appsLoading ? (
                <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Loading candidate records...</span>
                </div>
              ) : filteredApplications.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No candidates match your search.</div>
              ) : (
                filteredApplications.map((app) => {
                  const prog = parseProgramDisplay(app.program);
                  return (
                    <div key={app.id} className="p-4 space-y-3 hover:bg-slate-50/50 transition">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {app.avatarUrl ? (
                            <img
                              src={app.avatarUrl}
                              alt="avatar"
                              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 shadow-sm shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-black shrink-0 text-base shadow-sm">
                              {app.firstName ? app.firstName[0].toUpperCase() : 'S'}
                            </div>
                          )}
                          <div>
                            <h4 className="font-black text-slate-900 text-sm leading-tight">
                              {app.firstName} {app.middleName ? app.middleName + ' ' : ''}{app.lastName}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-mono truncate max-w-[180px] mt-0.5">{app.email}</p>
                            {app.phone && <p className="text-[11px] text-slate-400">{app.phone}</p>}
                          </div>
                        </div>
                        <div>
                          {app.status === 'Accepted' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full border border-emerald-200 shadow-2xs">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                              Accepted
                            </span>
                          )}
                          {app.status === 'Rejected' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 text-[10px] font-black rounded-full border border-rose-200 shadow-2xs">
                              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                              Declined
                            </span>
                          )}
                          {(!app.status || app.status === 'Pending') && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-black rounded-full border border-amber-200 shadow-2xs">
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                              Under Review
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2 text-xs text-slate-600">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-[11px]">Academic Major:</span>
                          <div className="text-right">
                            <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase mr-1">
                              {prog.badge}
                            </span>
                            <span className="font-bold text-slate-900 text-xs">{prog.title}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-[11px]">Academic Merit:</span>
                          <span className="font-black text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 text-xs shadow-2xs">
                            {app.gpa || 'N/A'}
                          </span>
                        </div>
                        {app.appointmentDate && (
                          <div className="flex justify-between items-center pt-1.5 border-t border-slate-200">
                            <span className="text-slate-400 text-[11px]">Verification:</span>
                            <span className="text-indigo-700 font-bold bg-white px-2.5 py-1 rounded-lg border border-indigo-100 text-[11px] shadow-2xs">
                              🗓️ {app.appointmentDate} • {app.appointmentTime || 'Scheduled'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => openStudentProfile(app)}
                          className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-2.5 rounded-xl text-xs border border-indigo-200 transition flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>{app.profileCompleted ? 'Full Profile ✓' : 'Review Bio'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => updateStatus(app.id, 'Accepted')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3.5 py-2.5 rounded-xl text-xs shadow-sm transition active:scale-95"
                        >
                          ✓ Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => updateStatus(app.id, 'Rejected')}
                          className="bg-white hover:bg-rose-50 text-rose-700 font-bold px-3 py-2.5 rounded-xl text-xs border border-rose-200 transition active:scale-95"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* DESKTOP CANDIDATE TABLE (Clean, spacious, high-end design) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-4 px-5 pl-6 min-w-[230px]">Applicant &amp; Contact</th>
                    <th className="py-4 px-4 min-w-[200px]">Degree &amp; Program</th>
                    <th className="py-4 px-4 min-w-[100px] text-center">Score / GPA</th>
                    <th className="py-4 px-4 min-w-[130px] text-center">Dossier &amp; Bio</th>
                    <th className="py-4 px-4 min-w-[210px]">Verification Interview</th>
                    <th className="py-4 px-4 min-w-[130px] text-center">Admission Status</th>
                    <th className="py-4 px-5 pr-6 min-w-[170px] text-right">Decision Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {appsLoading ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
                          <span className="font-semibold text-slate-600">Loading candidate records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredApplications.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-16 text-center text-slate-400">
                        <div className="space-y-2">
                          <Users className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="font-semibold text-slate-600">No candidate applications matching your search.</p>
                          <p className="text-[11px] text-slate-400">Try changing filter pills or clearing the search bar.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredApplications.map((app) => {
                      const prog = parseProgramDisplay(app.program);
                      return (
                        <tr key={app.id} className="hover:bg-indigo-50/30 transition duration-150">
                          {/* Applicant & Contact */}
                          <td className="py-4 px-5 pl-6 font-bold text-slate-900">
                            <div className="flex items-center gap-3.5">
                              {app.avatarUrl ? (
                                <img
                                  src={app.avatarUrl}
                                  alt="avatar"
                                  className="w-11 h-11 rounded-2xl object-cover ring-2 ring-slate-100 shadow-sm shrink-0"
                                />
                              ) : (
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-black shrink-0 text-sm shadow-sm">
                                  {app.firstName ? app.firstName[0].toUpperCase() : 'S'}
                                </div>
                              )}
                              <div className="space-y-0.5">
                                <span className="text-sm font-black text-slate-900 block leading-snug">
                                  {app.firstName} {app.middleName ? app.middleName + ' ' : ''}{app.lastName}
                                </span>
                                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
                                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate max-w-[150px]">{app.email}</span>
                                </div>
                                {app.phone && (
                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>{app.phone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Academic Major */}
                          <td className="py-4 px-4 font-medium text-slate-700">
                            <div className="space-y-1">
                              <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100 uppercase inline-block">
                                {prog.badge}
                              </span>
                              <span className="font-bold text-slate-900 text-xs block leading-snug">
                                {prog.title}
                              </span>
                            </div>
                          </td>

                          {/* GPA / Score */}
                          <td className="py-4 px-4 text-center">
                            <span className="inline-block bg-slate-50 text-slate-900 font-black text-xs px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                              {app.gpa || 'N/A'}
                            </span>
                          </td>

                          {/* Bio & Profile */}
                          <td className="py-4 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => openStudentProfile(app)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs ${
                                app.profileCompleted
                                  ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {app.profileCompleted ? (
                                <>
                                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>Full Profile ✓</span>
                                </>
                              ) : (
                                <>
                                  <User className="w-3.5 h-3.5 text-slate-500" />
                                  <span>View Bio</span>
                                </>
                              )}
                            </button>
                          </td>

                          {/* Scheduled Verification */}
                          <td className="py-4 px-4">
                            {app.appointmentDate ? (
                              <div className="space-y-1">
                                <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-800 font-bold px-2.5 py-1 rounded-lg border border-indigo-100 text-[11px] shadow-2xs">
                                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>{app.appointmentDate}</span>
                                </div>
                                {app.appointmentTime && (
                                  <div className="flex items-center gap-1 text-slate-600 text-[11px] font-medium pl-0.5">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    <span>{app.appointmentTime}</span>
                                  </div>
                                )}
                                {app.appointmentMode && (
                                  <div className="text-[10px] text-slate-400 pl-0.5">
                                    📍 {app.appointmentMode}
                                  </div>
                                )}
                                {app.appointmentStatus === 'Completed' && (
                                  <span className="inline-block text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    ✓ Visit Completed
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px] bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 inline-block">
                                Not Scheduled
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4 text-center">
                            {app.status === 'Accepted' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-black rounded-full border border-emerald-200 shadow-2xs">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Accepted
                              </span>
                            )}
                            {app.status === 'Rejected' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 text-xs font-black rounded-full border border-rose-200 shadow-2xs">
                                <span className="w-2 h-2 rounded-full bg-rose-500" />
                                Declined
                              </span>
                            )}
                            {(!app.status || app.status === 'Pending') && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-black rounded-full border border-amber-200 shadow-2xs">
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                                Under Review
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-5 pr-6 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateStatus(app.id, 'Accepted')}
                                className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-sm transition inline-flex items-center gap-1"
                              >
                                <span>✓ Accept</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => updateStatus(app.id, 'Rejected')}
                                className="bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 font-bold text-xs px-3 py-2 rounded-xl border border-rose-200 shadow-2xs transition active:scale-95 inline-flex items-center gap-1"
                              >
                                <span>✕ Reject</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* STUDENT PROFILE DEEP-INSPECTOR MODAL (Redesigned & Responsive) */}
          {selectedStudentProfile && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto animate-in fade-in">
              <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full my-auto overflow-hidden flex flex-col max-h-[92vh]">
                
                {/* Executive Modal Header */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-7 relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedStudentProfile(null)}
                    className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl backdrop-blur-md transition z-20"
                    title="Close dossier"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-4 sm:gap-5 pr-10">
                    {/* Fixed Constrained Avatar */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden ring-4 ring-white/15 shadow-2xl shrink-0 bg-slate-800 border border-white/20 flex items-center justify-center">
                      {selectedStudentProfile.avatarUrl ? (
                        <img
                          src={selectedStudentProfile.avatarUrl}
                          alt="Student Portrait"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/40 bg-gradient-to-tr from-indigo-600 to-indigo-800 font-black text-2xl">
                          {selectedStudentProfile.firstName ? selectedStudentProfile.firstName[0].toUpperCase() : 'S'}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg sm:text-2xl font-black text-white leading-tight">
                          {selectedStudentProfile.firstName} {selectedStudentProfile.middleName ? selectedStudentProfile.middleName + ' ' : ''}{selectedStudentProfile.lastName}
                        </h3>
                        {selectedStudentProfile.bloodGroup && (
                          <span className="bg-rose-500/20 text-rose-300 border border-rose-400/30 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                            🩸 {selectedStudentProfile.bloodGroup}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="bg-indigo-500/25 text-indigo-200 text-xs font-bold px-3 py-1 rounded-lg border border-indigo-400/30">
                          {selectedStudentProfile.program}
                        </span>
                        <span className="text-[11px] text-slate-300 font-mono bg-white/10 px-2 py-0.5 rounded-md">
                          Ref #{selectedStudentProfile.id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-300 flex items-center gap-1 pt-0.5">
                        <Mail className="w-3 h-3 text-indigo-300" />
                        <span>{selectedStudentProfile.email}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Scrollable Body */}
                <div className="p-5 sm:p-7 space-y-5 overflow-y-auto flex-grow text-xs text-slate-700">
                  
                  {/* Bio & Identity Records */}
                  <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-2.5 shadow-2xs">
                    <p className="font-extrabold text-indigo-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> Identity &amp; Contact Records
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Date of Birth</span>
                        <strong className="text-slate-900 text-xs">{selectedStudentProfile.dob || 'Not provided'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Gender</span>
                        <strong className="text-slate-900 text-xs">{selectedStudentProfile.gender || 'Not provided'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Citizenship</span>
                        <strong className="text-slate-900 text-xs">{selectedStudentProfile.nationality || 'Not provided'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Primary Phone</span>
                        <strong className="text-slate-900 text-xs">{selectedStudentProfile.phone || 'Not provided'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Alternate Phone</span>
                        <strong className="text-slate-900 text-xs">{selectedStudentProfile.altPhone || 'None'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Blood Group</span>
                        <strong className="text-slate-900 text-xs">{selectedStudentProfile.bloodGroup || 'Not specified'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Permanent Residential Address */}
                  <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-2 shadow-2xs">
                    <p className="font-extrabold text-indigo-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> Permanent Residential Address
                    </p>
                    <div className="pt-0.5">
                      <strong className="text-slate-900 block text-xs sm:text-sm font-bold">
                        {selectedStudentProfile.addressStreet || 'No street address provided'}
                      </strong>
                      <span className="text-slate-500 text-xs mt-0.5 block">
                        {[selectedStudentProfile.addressCity, selectedStudentProfile.addressState, selectedStudentProfile.addressZip, selectedStudentProfile.addressCountry].filter(Boolean).join(', ') || 'No city/state specified'}
                      </span>
                    </div>
                  </div>

                  {/* Emergency Guardian Contact */}
                  <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-2.5 shadow-2xs">
                    <p className="font-extrabold text-rose-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <HeartPulse className="w-3.5 h-3.5" /> Emergency &amp; Guardian Contact
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Guardian Name</span>
                        <strong className="text-slate-900 text-xs">{selectedStudentProfile.emergencyName || 'Not provided'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Relationship</span>
                        <strong className="text-slate-900 text-xs">{selectedStudentProfile.emergencyRelation || 'Parent'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Emergency Phone</span>
                        <strong className="text-slate-900 text-xs">{selectedStudentProfile.emergencyPhone || 'Not provided'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Emergency Email</span>
                        <strong className="text-slate-900 text-xs truncate block">{selectedStudentProfile.emergencyEmail || 'Not provided'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Academic & Housing Status */}
                  <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-2.5 shadow-2xs">
                    <p className="font-extrabold text-indigo-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" /> Academic History &amp; Campus Preferences
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">High School / Prior Institution</span>
                        <strong className="text-slate-900 text-xs">{selectedStudentProfile.highSchool || 'Not provided'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Graduation Year</span>
                        <strong className="text-slate-900 text-xs">{selectedStudentProfile.gradYear || '2025'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Residence Dorm Selection</span>
                        <strong className="text-slate-900 text-xs">{selectedStudentProfile.housingHall || 'Off-Campus / Not Required'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Meal &amp; Dining Plan</span>
                        <strong className="text-slate-900 text-xs">{selectedStudentProfile.housingDining || 'Not Selected'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Scheduled Appointment */}
                  {selectedStudentProfile.appointmentDate && (
                    <div className="bg-indigo-50/60 p-4 sm:p-5 rounded-2xl border border-indigo-100 space-y-2 shadow-2xs">
                      <p className="font-extrabold text-indigo-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Verification Interview Record
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                        <div>
                          <span className="text-indigo-400 block text-[10px] uppercase font-bold">Appointment Date</span>
                          <strong className="text-indigo-950 text-xs">🗓️ {selectedStudentProfile.appointmentDate}</strong>
                        </div>
                        <div>
                          <span className="text-indigo-400 block text-[10px] uppercase font-bold">Time Window</span>
                          <strong className="text-indigo-950 text-xs">🕒 {selectedStudentProfile.appointmentTime || 'Scheduled'}</strong>
                        </div>
                        <div>
                          <span className="text-indigo-400 block text-[10px] uppercase font-bold">Mode</span>
                          <strong className="text-indigo-950 text-xs">📍 {selectedStudentProfile.appointmentMode || 'In-Person'}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Modal Footer Controls */}
                <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => updateStatus(selectedStudentProfile.id, 'Accepted')}
                      className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Accept Student</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus(selectedStudentProfile.id, 'Rejected')}
                      className="flex-1 sm:flex-initial bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs px-4 py-2.5 rounded-xl border border-rose-200 shadow-2xs transition active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      <span>Decline</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedStudentProfile(null)}
                    className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
                  >
                    Close Dossier
                  </button>
                </div>

              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACADEMIC PROGRAMS */}
      {activeTab === 'programs' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">Academic Degree Programs</h3>
              <p className="text-xs text-slate-500 mt-1">Add new undergraduate/graduate majors, update descriptions, or remove courses.</p>
            </div>
            <button
              type="button"
              onClick={openAddModal}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold px-5 py-3 rounded-2xl text-xs shadow-lg shadow-indigo-500/25 transition flex items-center justify-center gap-2 shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add New Degree Major</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {programs.map((p) => (
              <div key={p.id} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between group hover:shadow-xl transition-all">
                <div className="space-y-3">
                  <div className="h-44 w-full rounded-2xl overflow-hidden bg-slate-100 relative">
                    <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    <span className="absolute top-3 left-3 text-[10px] font-extrabold text-indigo-700 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full uppercase shadow-sm">
                      {p.degree}
                    </span>
                    {p.duration && (
                      <span className="absolute top-3 right-3 text-[10px] font-bold text-slate-700 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full">
                        {p.duration}
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-base">{p.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{p.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => openEditModal(p)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Edit Program</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteProg(p.id)}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs px-3.5 py-2.5 rounded-xl transition flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Program Edit / Add Modal */}
          {showProgramModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in">
              <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 sm:p-8 space-y-5 my-4 sm:my-8 max-h-[92vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900">
                      {editProgId ? 'Edit Academic Major' : 'Add New Degree Program'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Configure course title, duration badge, and cover imagery</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowProgramModal(false)}
                    className="text-slate-400 hover:text-slate-700 p-2 rounded-xl bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleProgSave} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Program Title *</label>
                    <input
                      type="text"
                      required
                      value={progTitle}
                      onChange={(e) => setProgTitle(e.target.value)}
                      placeholder="e.g. Artificial Intelligence & Robotics"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Degree Badge *</label>
                      <input
                        type="text"
                        required
                        value={progDegree}
                        onChange={(e) => setProgDegree(e.target.value)}
                        placeholder="e.g. B.S. Degree"
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Duration *</label>
                      <input
                        type="text"
                        required
                        value={progDuration}
                        onChange={(e) => setProgDuration(e.target.value)}
                        placeholder="e.g. 4 Years"
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Cover Photo URL *</label>
                    <input
                      type="url"
                      required
                      value={progImage}
                      onChange={(e) => setProgImage(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    {progImage && (
                      <img src={progImage} alt="preview" className="mt-2 h-32 w-full object-cover rounded-2xl border border-slate-200" />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Description *</label>
                    <textarea
                      required
                      rows={3}
                      value={progDesc}
                      onChange={(e) => setProgDesc(e.target.value)}
                      placeholder="Brief overview of curriculum and career scope..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => setShowProgramModal(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={progSaving}
                      className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition disabled:opacity-60"
                    >
                      {progSaving ? 'Saving...' : 'Save Program'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: WEBSITE CMS CONTENT */}
      {activeTab === 'cms' && cmsData && (
        <form onSubmit={handleCmsSave} className="space-y-6 sm:space-y-8 animate-in fade-in">
          {/* Hero Banner Section */}
          <div className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5 sm:space-y-6">
            <div className="flex items-center gap-2 text-indigo-600 border-b pb-4">
              <Image className="w-5 h-5" />
              <h3 className="text-base sm:text-lg font-black text-slate-900">Hero Banner &amp; Brand Slogans</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">University Name (Main)</label>
                <input name="brandName" required defaultValue={cmsData.brandName} className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Brand Suffix</label>
                <input name="brandNameSuffix" required defaultValue={cmsData.brandNameSuffix} className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Slogan / Tagline</label>
                <input name="brandTagline" required defaultValue={cmsData.brandTagline} className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Hero Badge Pill</label>
                <input name="heroBadge" required defaultValue={cmsData.heroBadge} className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Hero Title Prefix</label>
                <input name="heroTitle" required defaultValue={cmsData.heroTitle} className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Hero Title Highlight</label>
                <input name="heroTitleHighlight" required defaultValue={cmsData.heroTitleHighlight} className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Hero Subtitle</label>
              <textarea name="heroSubtitle" rows={2} required defaultValue={cmsData.heroSubtitle} className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Hero Background Image URL</label>
              <input name="heroImage" required defaultValue={cmsData.heroImage} className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium" />
              {cmsData.heroImage && (
                <img src={cmsData.heroImage} alt="Hero Preview" className="mt-2 h-36 w-full object-cover rounded-2xl border border-slate-200 shadow-sm" />
              )}
            </div>
          </div>

          {/* Key Statistics */}
          <div className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5 sm:space-y-6">
            <div className="flex items-center gap-2 text-indigo-600 border-b pb-4">
              <BarChart2 className="w-5 h-5" />
              <h3 className="text-base sm:text-lg font-black text-slate-900">Key Statistics Counter</h3>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {(cmsData.stats || []).map((s, i) => (
                <div key={i} className="p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase mb-1">Stat {i + 1} Value</label>
                  <input name={`stat-val-${i}`} required defaultValue={s.value} className="w-full px-3 py-2 rounded-xl border text-sm font-black text-indigo-600 mb-2" />
                  <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase mb-1">Stat {i + 1} Label</label>
                  <input name={`stat-lbl-${i}`} required defaultValue={s.label} className="w-full px-3 py-2 rounded-xl border text-xs font-medium" />
                </div>
              ))}
            </div>
          </div>

          {/* Campus Facilities */}
          <div className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
              <div className="flex items-center gap-2 text-indigo-600">
                <Compass className="w-5 h-5" />
                <h3 className="text-base sm:text-lg font-black text-slate-900">Campus Facilities &amp; Tour Highlights</h3>
              </div>
              <button
                type="button"
                onClick={addFacility}
                className="w-full sm:w-auto text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 border border-indigo-200 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Facility Card</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {facilities.map((fac, idx) => (
                <div key={idx} className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-600 uppercase">Facility Card {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeFacility(idx)}
                      className="text-rose-500 hover:text-rose-700 text-xs font-bold p-1 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Title</label>
                    <input type="text" value={fac.title || ''} onChange={(e) => updateFacility(idx, 'title', e.target.value)} className="w-full px-3 py-2 rounded-xl border text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Category</label>
                      <input type="text" value={fac.category || ''} onChange={(e) => updateFacility(idx, 'category', e.target.value)} className="w-full px-3 py-2 rounded-xl border text-xs" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Tags (comma separated)</label>
                      <input type="text" value={(fac.tags || []).join(', ')} onChange={(e) => updateFacility(idx, 'tags', e.target.value.split(',').map((t) => t.trim()))} className="w-full px-3 py-2 rounded-xl border text-xs" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Description</label>
                    <textarea rows={2} value={fac.description || ''} onChange={(e) => updateFacility(idx, 'description', e.target.value)} className="w-full px-3 py-2 rounded-xl border text-xs" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Image URL</label>
                    <input type="text" value={fac.image || ''} onChange={(e) => updateFacility(idx, 'image', e.target.value)} className="w-full px-3 py-2 rounded-xl border text-xs" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Video URL</label>
                    <input type="text" value={fac.videoUrl || ''} onChange={(e) => updateFacility(idx, 'videoUrl', e.target.value)} className="w-full px-3 py-2 rounded-xl border text-xs" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5 sm:space-y-6">
            <div className="flex items-center gap-2 text-indigo-600 border-b pb-4">
              <PhoneCall className="w-5 h-5" />
              <h3 className="text-base sm:text-lg font-black text-slate-900">Admissions Contact Details</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Admissions Email</label>
                <input name="contactEmail" type="email" required defaultValue={cmsData.contactEmail} className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Support Hotline</label>
                <input name="contactPhone" required defaultValue={cmsData.contactPhone} className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Campus Address</label>
                <input name="contactAddress" required defaultValue={cmsData.contactAddress} className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium" />
              </div>
            </div>
          </div>

          {/* Save Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm">
            <button
              type="button"
              onClick={() => {
                setCmsData({ ...DEFAULT_SITE_CONTENT });
                setFacilities(DEFAULT_SITE_CONTENT.facilities);
              }}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 transition py-1"
            >
              Reset Content to System Defaults
            </button>
            <button
              type="submit"
              disabled={cmsSaving}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold px-8 py-3.5 rounded-2xl text-sm shadow-lg shadow-indigo-500/25 transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Check className="w-4 h-4" />
              <span>{cmsSaving ? 'Saving Changes...' : 'Save All Website Changes'}</span>
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
