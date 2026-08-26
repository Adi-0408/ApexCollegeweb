import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Play, CheckCircle, ShieldCheck } from 'lucide-react';
import { useSiteData } from '../context/SiteDataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import LoginModal from '../components/LoginModal.jsx';

export default function HomePage() {
  const { siteContent, programs } = useSiteData();
  const { currentUser, isAccepted, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginProgram, setLoginProgram] = useState('');

  const c = siteContent || {};

  function handleApplyClick(e, progName = '') {
    if (!currentUser) {
      if (e) e.preventDefault();
      setLoginProgram(progName);
      setShowLoginModal(true);
    } else if (isAdmin) {
      navigate('/admin');
    } else {
      navigate(progName ? `/portal?program=${encodeURIComponent(progName)}` : '/portal#apply');
    }
  }

  const featuredPrograms = programs.slice(0, 3);
  const previewFacilities = (c.facilities || []).slice(0, 4);
  const stats = c.stats || [
    { value: '#12', label: 'National Rank' },
    { value: '96%', label: 'Graduate Employment' },
    { value: '50+', label: 'Academic Majors' },
    { value: '$15M', label: 'Scholarships Awarded' },
  ];

  return (
    <>
      <main className="flex-grow w-full space-y-16 sm:space-y-24 pb-20">
        {/* HERO SECTION */}
        <section className="relative bg-slate-900 text-white py-20 sm:py-28 lg:py-36 w-full overflow-hidden">
          <img
            src={c.heroImage || 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=1920&q=80'}
            alt="University Campus"
            className="absolute inset-0 w-full h-full object-cover opacity-30 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b sm:bg-gradient-to-r from-slate-950/90 via-slate-900/70 to-slate-950/80 sm:to-transparent" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl space-y-6 sm:space-y-8">
              <span className="inline-block bg-indigo-500/25 text-indigo-300 text-xs sm:text-sm font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-indigo-400/30 backdrop-blur-md">
                {c.heroBadge || 'Admissions Open 2026-27'}
              </span>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15]">
                <span>{c.heroTitle || 'Shape Your Future at'} </span>
                <span className="text-indigo-400 block sm:inline">{c.heroTitleHighlight || 'Apex University'}</span>
              </h1>
              <p className="text-slate-300 text-base sm:text-lg lg:text-xl font-normal leading-relaxed max-w-2xl">
                {c.heroSubtitle || "Join a globally recognized institution dedicated to innovation, research, and developing tomorrow's leaders."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3.5 pt-2 sm:pt-4">
                {isAdmin ? (
                  <Link
                    to="/admin"
                    className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-extrabold px-8 py-4 rounded-2xl shadow-xl border border-white/20 transition flex items-center justify-center gap-2.5 text-sm sm:text-base"
                  >
                    <ShieldCheck className="w-5 h-5 text-indigo-400" />
                    <span>Open Admin Console</span>
                  </Link>
                ) : isAccepted ? (
                  <Link
                    to="/portal"
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold px-8 py-4 rounded-2xl shadow-xl shadow-emerald-600/30 transition flex items-center justify-center gap-2.5 text-sm sm:text-base"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Access Student Portal (Offer Accepted)</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => handleApplyClick(e)}
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-extrabold px-8 py-4 rounded-2xl shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2.5 text-sm sm:text-base"
                  >
                    <span>Start Application</span>
                    <Sparkles className="w-5 h-5" />
                  </button>
                )}
                <Link
                  to="/programs"
                  className="w-full sm:w-auto bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/25 font-bold px-8 py-4 rounded-2xl backdrop-blur-md transition flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <span>Explore Degrees</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-16 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 bg-white rounded-3xl shadow-2xl p-4 sm:p-8 border border-slate-100">
            {stats.map((s, i) => (
              <div key={i} className={`bg-slate-50/70 sm:bg-transparent rounded-2xl sm:rounded-none p-4 sm:p-0 text-center ${i < 3 ? 'sm:border-r border-slate-100' : ''}`}>
                <p className="text-2xl sm:text-4xl font-black text-indigo-600">{s.value}</p>
                <p className="text-slate-500 text-xs sm:text-sm font-semibold mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FEATURED PROGRAMS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">Academic Catalog</span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mt-2">Featured Degree Programs</h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-xl">Explore our industry-aligned curricula designed to prepare you for high-impact global careers.</p>
            </div>
            <Link to="/programs" className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-800 transition shrink-0">
              <span>View All Academic Programs</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {featuredPrograms.length === 0 ? (
              <div className="col-span-3 text-center py-8 text-slate-400">Loading programs...</div>
            ) : featuredPrograms.map(p => {
              const fullTitle = p.fullTitle || `${p.degree ? p.degree + ' ' : ''}${p.title}`;
              return (
                <div key={p.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                  <div>
                    <div className="h-48 sm:h-56 w-full overflow-hidden bg-slate-100 relative">
                      <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      <span className="absolute top-4 left-4 text-[10px] font-extrabold text-indigo-700 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full uppercase shadow-sm">{p.degree || 'Degree'}</span>
                      {p.duration && <span className="absolute top-4 right-4 text-[10px] font-bold text-slate-700 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full">{p.duration}</span>}
                    </div>
                    <div className="p-6 space-y-2">
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 group-hover:text-indigo-600 transition">{p.title}</h3>
                      <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{p.description}</p>
                    </div>
                  </div>
                  <div className="p-6 pt-0 border-t border-slate-100 mt-4">
                    {isAdmin ? (
                      <Link
                        to="/admin"
                        className="inline-flex items-center justify-between w-full pt-4 text-indigo-600 text-xs sm:text-sm font-bold hover:text-indigo-800 transition"
                      >
                        <span>Manage in Admin Panel</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    ) : isAccepted ? (
                      <Link
                        to="/portal"
                        className="inline-flex items-center justify-between w-full pt-4 text-emerald-600 text-xs sm:text-sm font-bold hover:text-emerald-800 transition"
                      >
                        <span>Admitted • View Student Portal</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleApplyClick(e, fullTitle)}
                        className="inline-flex items-center justify-between w-full pt-4 text-indigo-600 text-xs sm:text-sm font-bold hover:text-indigo-800 transition"
                      >
                        <span>Apply for this Program</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CAMPUS LIFE PREVIEW */}
        <section className="bg-slate-900 text-white py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="bg-indigo-500/20 text-indigo-300 text-xs font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full border border-indigo-500/30">Life on Campus</span>
              <h2 className="text-2xl sm:text-4xl font-black text-white">World-Class Facilities &amp; Vibrant Community</h2>
              <p className="text-slate-400 text-xs sm:text-sm">Tour our robotics complexes, Olympic athletics arena, collaborative research commons, and sustainable student housing.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              {previewFacilities.map(fac => (
                <div key={fac.id} className="bg-slate-800/80 rounded-3xl border border-slate-700/60 overflow-hidden shadow-lg hover:shadow-2xl transition flex flex-col group">
                  <div className="relative h-56 sm:h-64 bg-slate-900 overflow-hidden">
                    <img src={fac.image} alt={fac.title} className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition duration-500" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <a href={fac.videoUrl || 'https://www.youtube.com'} target="_blank" rel="noopener noreferrer"
                        className="w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition" aria-label="Watch tour">
                        <Play className="w-6 h-6 ml-0.5" />
                      </a>
                    </div>
                  </div>
                  <div className="p-6 flex-grow flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="text-lg sm:text-xl font-extrabold text-white">{fac.title}</h3>
                      <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">{fac.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center pt-4">
              <Link to="/campus" className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-white text-slate-900 hover:bg-slate-100 font-extrabold px-8 py-4 rounded-2xl shadow-xl transition text-sm">
                <span>Explore Campus Life in Detail</span>
                <ArrowRight className="w-4 h-4 text-indigo-600" />
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-indigo-900 rounded-3xl p-6 sm:p-12 text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 shadow-2xl">
            <div className="space-y-3 max-w-xl">
              <span className="bg-white/20 text-indigo-100 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                {isAdmin ? 'University Administration' : isAccepted ? 'Admitted Student Notice' : 'Apply for Fall 2026'}
              </span>
              <h2 className="text-2xl sm:text-4xl font-black">
                {isAdmin
                  ? 'Administrative Management Suite'
                  : isAccepted
                  ? 'Congratulations on Your Admission!'
                  : 'Ready to Join Apex University?'}
              </h2>
              <p className="text-indigo-100 text-xs sm:text-sm leading-relaxed">
                {isAdmin
                  ? 'Review pending candidate applications, modify curriculum degrees, and manage all site content.'
                  : isAccepted
                  ? 'Your offer of admission has been extended. Access your student portal to complete your enrollment roadmap.'
                  : 'Applications for the upcoming session are reviewed on a rolling basis. Create your student account and submit your admission application today.'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full lg:w-auto shrink-0">
              {isAdmin ? (
                <Link to="/admin" className="w-full sm:w-auto text-center bg-white text-slate-900 hover:bg-slate-100 font-extrabold px-6 py-4 rounded-2xl shadow-md transition text-sm flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Open Admin Console</span>
                </Link>
              ) : (
                <Link to="/portal" className="w-full sm:w-auto text-center bg-white text-indigo-800 hover:bg-indigo-50 font-extrabold px-6 py-4 rounded-2xl shadow-md transition text-sm">
                  Access Student Portal
                </Link>
              )}
              <Link to="/contact" className="w-full sm:w-auto text-center bg-indigo-900/60 hover:bg-indigo-900 text-white font-bold px-6 py-4 rounded-2xl border border-indigo-400/40 transition text-sm">
                Contact Admissions
              </Link>
            </div>
          </div>
        </section>
      </main>
      <LoginModal open={showLoginModal} onClose={() => setShowLoginModal(false)} targetProgram={loginProgram} />
    </>
  );
}
