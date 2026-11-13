import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { GraduationCap, User, Home, BookOpen, Building2, Mail, Sparkles, ChevronDown, ShieldCheck } from 'lucide-react';
import { useSiteData } from '../context/SiteDataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import LoginModal from './LoginModal.jsx';

export default function Navbar() {
  const { siteContent } = useSiteData();
  const { currentUser, isAccepted, isAdmin, isFaculty } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalProgram, setLoginModalProgram] = useState('');
  const headerRef = useRef(null);

  const brand = siteContent || {};
  const brandName = brand.brandName || 'APEX';
  const brandSuffix = brand.brandNameSuffix || 'UNIVERSITY';
  const brandTagline = brand.brandTagline || 'Excellence in Education';

  useEffect(() => {
    function handleClickOutside(e) {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setMobileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleApplyClick(e, progName = '') {
    if (!currentUser) {
      if (e) e.preventDefault();
      setLoginModalProgram(progName);
      setShowLoginModal(true);
    } else if (isAdmin) {
      navigate('/admin');
    } else if (isFaculty) {
      navigate('/faculty');
    } else {
      if (progName) {
        navigate(`/portal?program=${encodeURIComponent(progName)}`);
      } else {
        navigate('/portal#apply');
      }
    }
  }

  const navLinks = [
    { to: '/', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { to: '/programs', label: 'Programs', icon: <BookOpen className="w-4 h-4" /> },
    { to: '/campus', label: 'Campus Life', icon: <Building2 className="w-4 h-4" /> },
    { to: '/contact', label: 'Contact', icon: <Mail className="w-4 h-4" /> },
  ];

  return (
    <>
      <header ref={headerRef} className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            {/* Brand Logo */}
            <Link to="/" className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-11 sm:h-11 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-200 shrink-0">
                <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center text-base sm:text-xl font-black tracking-tight leading-none whitespace-nowrap">
                  <span className="text-slate-900">{brandName}</span>
                  <span className="text-indigo-600 ml-1">{brandSuffix}</span>
                </div>
                <p className="hidden sm:block text-[9px] sm:text-[10px] tracking-widest text-slate-400 font-bold uppercase mt-1">
                  {brandTagline}
                </p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8 font-semibold text-slate-600 text-sm">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    isActive
                      ? 'text-indigo-600 font-bold transition'
                      : 'hover:text-indigo-600 transition'
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Desktop Right Controls (Hidden on mobile) */}
            <div className="hidden lg:flex items-center gap-3 shrink-0">
              {isFaculty ? (
                <Link
                  to="/faculty"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 rounded-xl shadow-md transition"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-200" />
                  <span>Faculty Console</span>
                </Link>
              ) : isAdmin ? (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2.5 rounded-xl shadow-md transition"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>Admin Console</span>
                </Link>
              ) : (
                <Link
                  to="/portal"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition border border-slate-200"
                >
                  <User className="w-4 h-4 text-indigo-600" />
                  <span>Portal</span>
                </Link>
              )}

              {/* Show Apply Now button ONLY if not accepted AND not admin AND not faculty */}
              {!isAccepted && !isAdmin && !isFaculty && (
                <button
                  type="button"
                  onClick={(e) => handleApplyClick(e)}
                  className="inline-flex bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-md shadow-indigo-600/25 transition items-center gap-1.5 text-xs sm:text-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Apply Now</span>
                </button>
              )}
            </div>

            {/* Mobile Right Controls: Exactly 2 sections: 1. Apply, 2. Dropdown List */}
            <div className="flex lg:hidden items-center gap-1.5 sm:gap-2 shrink-0">
              {/* 1. APPLY BUTTON (or Portal if logged in) */}
              {!isAccepted && !isAdmin && !isFaculty ? (
                <button
                  type="button"
                  onClick={(e) => handleApplyClick(e)}
                  className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl shadow-md text-[11px] sm:text-xs transition flex items-center gap-1 sm:gap-1.5 whitespace-nowrap"
                >
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>Apply Now</span>
                </button>
              ) : (
                <Link
                  to={isAdmin ? '/admin' : isFaculty ? '/faculty' : '/portal'}
                  className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl shadow-md text-[11px] sm:text-xs transition flex items-center gap-1 sm:gap-1.5 whitespace-nowrap"
                >
                  <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>{isAdmin ? 'Admin' : isFaculty ? 'Faculty' : 'Portal'}</span>
                </Link>
              )}

              {/* 2. DROPDOWN LIST TRIGGER */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMobileOpen((prev) => !prev)}
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition focus:outline-none whitespace-nowrap"
                  aria-label="Toggle Pages Dropdown Menu"
                >
                  <span>Menu</span>
                  <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 ${mobileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu List */}
                {mobileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3.5 py-1.5 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Pages</div>
                    <Link
                      to="/"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
                    >
                      <Home className="w-4 h-4 text-slate-400" />
                      <span>Home</span>
                    </Link>
                    <Link
                      to="/programs"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
                    >
                      <BookOpen className="w-4 h-4 text-slate-400" />
                      <span>Academic Programs</span>
                    </Link>
                    <Link
                      to="/campus"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
                    >
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span>Campus Life & Facilities</span>
                    </Link>
                    <Link
                      to="/contact"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
                    >
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span>Contact & Inquiries</span>
                    </Link>
                    <div className="my-1 border-t border-slate-100" />
                    {isFaculty ? (
                      <Link
                        to="/faculty"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition"
                      >
                        <ShieldCheck className="w-4 h-4 text-indigo-600" />
                        <span>Faculty Staff Console</span>
                      </Link>
                    ) : isAdmin ? (
                      <Link
                        to="/admin"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-slate-900 hover:bg-slate-100 transition"
                      >
                        <ShieldCheck className="w-4 h-4 text-slate-900" />
                        <span>Admin Console</span>
                      </Link>
                    ) : (
                      <Link
                        to="/portal"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition"
                      >
                        <User className="w-4 h-4 text-indigo-600" />
                        <span>Student Portal</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Login Modal for Guests */}
      <LoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        targetProgram={loginModalProgram}
      />
    </>
  );
}
