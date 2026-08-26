import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, CheckCircle, ShieldCheck } from 'lucide-react';
import { useSiteData } from '../context/SiteDataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import LoginModal from '../components/LoginModal.jsx';

export default function ProgramsPage() {
  const { programs } = useSiteData();
  const { currentUser, isAccepted, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginProgram, setLoginProgram] = useState('');

  function handleApplyClick(e, progName = '') {
    if (!currentUser) {
      if (e) e.preventDefault();
      setLoginProgram(progName);
      setShowLoginModal(true);
    } else if (isAdmin) {
      navigate('/admin');
    } else {
      navigate(`/portal?program=${encodeURIComponent(progName)}`);
    }
  }

  const filtered = programs.filter((p) => {
    let pass = true;
    if (filter === 'bs') {
      pass = (p.degree && p.degree.toLowerCase().includes('b.s')) || p.title.toLowerCase().includes('science') || p.title.toLowerCase().includes('ai');
    } else if (filter === 'bba') {
      pass = (p.degree && p.degree.toLowerCase().includes('b.b.a')) || p.title.toLowerCase().includes('business');
    } else if (filter === 'eng') {
      pass = (p.degree && p.degree.toLowerCase().includes('b.tech')) || p.title.toLowerCase().includes('robotics') || p.title.toLowerCase().includes('engineering');
    }
    if (pass && search.trim()) {
      const q = search.toLowerCase();
      pass = p.title.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)) || (p.degree && p.degree.toLowerCase().includes(q));
    }
    return pass;
  });

  const filterOptions = [
    { key: 'all', label: 'All Degrees' },
    { key: 'bs', label: 'Science & Tech (B.S.)' },
    { key: 'bba', label: 'Business (B.B.A)' },
    { key: 'eng', label: 'Engineering (B.Tech)' },
  ];

  return (
    <>
      <main className="flex-grow w-full space-y-10 sm:space-y-16 pb-20">
        <section className="bg-slate-900 text-white py-16 sm:py-24 text-center relative overflow-hidden">
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 space-y-4">
            <span className="bg-indigo-500/20 text-indigo-300 text-xs font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full border border-indigo-500/30">Degree Catalog 2026-27</span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">Academic Degrees &amp; Programs</h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">Choose from our globally recognized undergraduate, graduate, and engineering majors engineered for career excellence.</p>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full lg:w-auto">
              {filterOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setFilter(opt.key)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap shadow-sm ${
                    filter === opt.key ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="relative w-full lg:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                placeholder="Search programs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filtered.length === 0 ? (
              <div className="col-span-3 text-center py-16 text-slate-400 bg-white rounded-3xl border border-slate-200 p-8">
                No programs match your selection.
              </div>
            ) : filtered.map((p) => {
              const fullTitle = p.fullTitle || `${p.degree ? p.degree + ' ' : ''}${p.title}`;
              return (
                <div key={p.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                  <div>
                    <div className="h-52 sm:h-60 w-full overflow-hidden bg-slate-100 relative">
                      <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      <span className="absolute top-4 left-4 text-[10px] font-extrabold text-indigo-700 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full uppercase shadow-sm">{p.degree || 'Degree'}</span>
                      {p.duration && <span className="absolute top-4 right-4 text-[10px] font-bold text-slate-700 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full">{p.duration}</span>}
                    </div>
                    <div className="p-6 space-y-2.5">
                      <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition">{p.title}</h3>
                      <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{p.description}</p>
                    </div>
                  </div>
                  <div className="p-6 pt-0 border-t border-slate-100 mt-4">
                    <div className="pt-4 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-semibold">Fall 2026 Entry</span>
                      {isAdmin ? (
                        <Link
                          to="/admin"
                          className="bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-2"
                        >
                          <ShieldCheck className="w-4 h-4 text-indigo-400" />
                          <span>Manage Program</span>
                        </Link>
                      ) : isAccepted ? (
                        <Link
                          to="/portal"
                          className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Admitted • View Portal</span>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleApplyClick(e, fullTitle)}
                          className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-2"
                        >
                          <span>Apply Now</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
      <LoginModal open={showLoginModal} onClose={() => setShowLoginModal(false)} targetProgram={loginProgram} />
    </>
  );
}
