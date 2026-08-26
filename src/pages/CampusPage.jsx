import React, { useState } from 'react';
import { ArrowDown, PlayCircle, X, Play, Home, Utensils, ShieldCheck } from 'lucide-react';
import { useSiteData } from '../context/SiteDataContext.jsx';

export default function CampusPage() {
  const { siteContent } = useSiteData();
  const facilities = siteContent?.facilities || [];
  const [facFilter, setFacFilter] = useState('all');
  const [videoModal, setVideoModal] = useState(null);

  const campusMetrics = [
    { value: '250+', label: 'Acres of Green Campus' },
    { value: '120+', label: 'Research & Maker Labs' },
    { value: '85+', label: 'Student Clubs & Teams' },
    { value: '100%', label: 'Clean Solar Energy' },
  ];

  const facFilterOptions = [
    { key: 'all', label: 'All Facilities' },
    { key: 'academic', label: 'Academic & Commons' },
    { key: 'research', label: 'Research & Labs' },
    { key: 'sports', label: 'Athletics & Sports' },
    { key: 'innovation', label: 'Innovation & Incubator' },
  ];

  const filtered = facilities.filter((f) =>
    facFilter === 'all' || (f.category && f.category.toLowerCase() === facFilter.toLowerCase())
  );

  const residentialCards = [
    {
      icon: <Home className="w-6 h-6" />,
      title: 'Modern Smart Suites',
      desc: 'Air-conditioned studio and shared suites featuring keycard digital locks, ergonomic workstations, and en-suite bathrooms.'
    },
    {
      icon: <Utensils className="w-6 h-6" />,
      title: 'Farm-to-Table Dining',
      desc: '4 multi-cuisine campus dining halls offering organic salads, authentic world cuisines, artisan espresso bars, and allergen-friendly options.'
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: '24/7 Security & Health',
      desc: 'Round-the-clock campus safety patrol, secure dormitory check-in, on-site student health clinics, and wellness counseling.'
    },
  ];

  return (
    <main className="flex-grow w-full space-y-16 sm:space-y-24 pb-20">
      {/* HERO */}
      <section className="relative bg-slate-900 text-white py-20 sm:py-28 lg:py-36 w-full overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1920&q=80"
          alt="Campus Aerial"
          className="absolute inset-0 w-full h-full object-cover opacity-25 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b sm:bg-gradient-to-r from-slate-950/90 via-slate-900/75 to-slate-950/85 sm:to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            <span className="inline-block bg-indigo-500/25 text-indigo-300 text-xs sm:text-sm font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-indigo-400/30 backdrop-blur-md">
              Campus &amp; Student Experience
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15]">
              World-Class Facilities Built for Breakthroughs
            </h1>
            <p className="text-slate-300 text-base sm:text-lg lg:text-xl font-normal leading-relaxed">
              From supercomputing clusters and Olympic athletic venues to sustainable smart dormitories and vibrant student arts hubs.
            </p>
            <div className="flex flex-col sm:flex-row gap-3.5 pt-2 sm:pt-4">
              <a
                href="#facilities-section"
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-extrabold px-8 py-4 rounded-2xl shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <span>Explore All Facilities</span>
                <ArrowDown className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setVideoModal({ title: 'Apex University Campus Drone Tour', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' })}
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/25 font-bold px-8 py-4 rounded-2xl backdrop-blur-md transition flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <PlayCircle className="w-5 h-5 text-indigo-400" />
                <span>Watch Campus Drone Tour</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CAMPUS METRICS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-16 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 bg-white rounded-3xl shadow-2xl p-4 sm:p-8 border border-slate-100">
          {campusMetrics.map((m, i) => (
            <div key={i} className={`bg-slate-50/70 sm:bg-transparent rounded-2xl sm:rounded-none p-4 sm:p-0 text-center ${i < 3 ? 'sm:border-r border-slate-100' : ''}`}>
              <p className="text-2xl sm:text-4xl font-black text-indigo-600">{m.value}</p>
              <p className="text-slate-500 text-xs sm:text-sm font-semibold mt-1">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FACILITIES */}
      <section id="facilities-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 scroll-mt-28">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">Infrastructure</span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mt-2">World-Class Facilities &amp; Labs</h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-xl">Explore our advanced scientific complexes, collaborative libraries, and athletic arenas.</p>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full md:w-auto">
            {facFilterOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setFacFilter(opt.key)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap shadow-sm ${
                  facFilter === opt.key ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filtered.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-slate-400 bg-white rounded-3xl border border-slate-200 p-8">No facilities found in this category.</div>
          ) : filtered.map((fac) => (
            <div key={fac.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="h-52 sm:h-64 w-full overflow-hidden bg-slate-100 relative">
                  <img src={fac.image} alt={fac.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  <span className="absolute top-4 left-4 text-[10px] font-extrabold text-indigo-700 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full uppercase shadow-sm">{fac.category || 'Facility'}</span>
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setVideoModal({ title: fac.title, url: fac.videoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ' })}
                      className="w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition active:scale-95"
                      aria-label="Watch video tour"
                    >
                      <Play className="w-6 h-6 ml-0.5" />
                    </button>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition">{fac.title}</h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{fac.description}</p>
                </div>
              </div>
              <div className="p-6 pt-0 border-t border-slate-100 mt-4">
                <div className="pt-4 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold">Open Daily 6 AM - 11 PM</span>
                  <button
                    type="button"
                    onClick={() => setVideoModal({ title: fac.title, url: fac.videoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ' })}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-800 transition"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Virtual Tour</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* RESIDENTIAL LIFE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">Residential Life</span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mt-2">Dormitories &amp; Culinary Dining</h2>
          <p className="text-slate-500 text-xs sm:text-sm">Experience connected on-campus living with chef-crafted dining, private study lounges, and high-speed fiber internet.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {residentialCards.map((card, i) => (
            <div key={i} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-sm hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">{card.icon}</div>
              <h3 className="font-black text-lg text-slate-900">{card.title}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* VIDEO MODAL */}
      {videoModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 sm:p-6">
          <div className="bg-slate-900 rounded-3xl overflow-hidden max-w-3xl w-full border border-slate-800 shadow-2xl space-y-4 p-4 sm:p-6">
            <div className="flex items-center justify-between text-white border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm sm:text-base">{videoModal.title}</h3>
              <button
                type="button"
                onClick={() => setVideoModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-950">
              <iframe
                className="w-full h-full"
                src={videoModal.url}
                title="Campus Tour"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <span>Experience life at Apex University</span>
              <button
                type="button"
                onClick={() => setVideoModal(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-xl transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
