import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { GraduationCap, User, Home, BookOpen, Building2, Mail, Sparkles, Menu, X, ShieldCheck } from 'lucide-react';
import { useSiteData } from '../context/SiteDataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import LoginModal from './LoginModal.jsx';

export default function Navbar() {
  const { siteContent } = useSiteData();
  const { currentUser, isAccepted, isAdmin } = useAuth();
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
            <Link to="/" className="flex items-center gap-3 shrink-0">
              <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-200">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center text-lg sm:text-xl font-black tracking-tight leading-none">
                  <span className="text-slate-900">{brandName}</span>
                  <span className="text-indigo-600 ml-1">{brandSuffix}</span>
                </div>
                <p className="text-[9px] sm:text-[10px] tracking-widest text-slate-400 font-bold uppercase mt-1">
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

            {/* Right Controls */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {isAdmin ? (
                <Link
                  to="/admin"
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 px-3.5 sm:px-4 py-2.5 rounded-xl shadow-md transition"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>Admin Console</span>
                </Link>
              ) : (
                <Link
                  to="/portal"
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 sm:px-4 py-2.5 rounded-xl transition border border-slate-200"
                >
                  <User className="w-4 h-4 text-indigo-600" />
                  <span>Portal</span>
                </Link>
              )}

              {/* Show Apply Now button ONLY if not accepted AND not admin */}
              {!isAccepted && !isAdmin && (
                <button
                  type="button"
                  onClick={(e) => handleApplyClick(e)}
                  className="hidden sm:inline-flex bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold px-4 sm:px-5 py-2.5 rounded-xl shadow-md shadow-indigo-600/25 transition items-center gap-1.5 text-xs sm:text-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Apply Now</span>
                </button>
              )}

              {/* Mobile Hamburger / Cross Toggle Button */}
              <button
                type="button"
                onClick={() => setMobileOpen((prev) => !prev)}
                className="lg:hidden p-2.5 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition active:scale-95 border border-slate-200"
                aria-label="Toggle mobile menu"
              >
                {mobileOpen ? (
                  <X className="w-5 h-5 text-slate-900" />
                ) : (
                  <Menu className="w-5 h-5 text-slate-900" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileOpen && (
            <div className="lg:hidden py-4 border-t border-slate-100 space-y-2 animate-in fade-in">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 font-semibold text-sm transition"
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              ))}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                {isAdmin ? (
                  <Link
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm transition"
                  >
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <span>Admin Management Console</span>
                  </Link>
                ) : (
                  <Link
                    to="/portal"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold text-sm transition"
                  >
                    <User className="w-4 h-4 text-indigo-600" />
                    <span>Student Portal</span>
                  </Link>
                )}
                {!isAccepted && !isAdmin && (
                  <button
                    type="button"
                    onClick={(e) => {
                      setMobileOpen(false);
                      handleApplyClick(e);
                    }}
                    className="w-full bg-indigo-600 text-white font-extrabold px-4 py-3 rounded-xl shadow transition flex items-center justify-center gap-2 text-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Apply Now</span>
                  </button>
                )}
              </div>
            </div>
          )}
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
