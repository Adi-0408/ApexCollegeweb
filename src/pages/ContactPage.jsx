import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Clock, UserCheck, BookOpen, Rocket, Compass, ChevronDown, ArrowRight, CheckCircle, ShieldCheck } from 'lucide-react';
import { useSiteData } from '../context/SiteDataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function ContactPage() {
  const { siteContent } = useSiteData();
  const { isAccepted, isAdmin } = useAuth();
  const c = siteContent || {};
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: 'What are the admission requirements for undergraduate programs?',
      a: 'Requirements include a completed application form, high school transcripts (minimum 3.0 GPA), two letters of recommendation, a personal statement, and standardized test scores (SAT/ACT optional for 2026 intake).'
    },
    {
      q: 'How do I schedule a campus visit or virtual tour?',
      a: 'Campus visits can be booked through the Student Portal. Virtual tours are available Monday–Saturday on our website. In-person visits require a 48-hour advance booking on Saturdays.'
    },
    {
      q: 'Are scholarships available for international students?',
      a: 'Yes. Apex University offers merit-based scholarships covering up to 50% of tuition for international students with outstanding academic records. Financial aid applications open each January.'
    },
    {
      q: 'How long does the application review process take?',
      a: 'Most applications are reviewed within 3–5 business days. You will receive a decision via email along with your Student Portal notification.'
    },
  ];

  return (
    <main className="flex-grow w-full pb-20">
      {/* HERO */}
      <section className="relative bg-slate-900 text-white py-20 sm:py-28 text-center overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 space-y-5">
          <span className="inline-block bg-indigo-500/20 text-indigo-300 text-xs font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full border border-indigo-500/30">
            Admissions Helpdesk
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
            We're Here to Help You<br /><span className="text-indigo-400">Every Step of the Way</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Have questions about admission criteria, scholarships, or campus visits? Our advisors respond within 24 business hours.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {isAdmin ? (
              <Link
                to="/admin"
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-xl text-sm transition shadow-lg border border-white/20 flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Admin Console</span>
              </Link>
            ) : isAccepted ? (
              <Link
                to="/portal"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition shadow-lg shadow-emerald-900/40 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Access Student Portal</span>
              </Link>
            ) : (
              <Link
                to="/portal"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition shadow-lg shadow-indigo-900/40 flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>Apply Now</span>
              </Link>
            )}
            <Link
              to="/programs"
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-xl text-sm transition border border-white/20 flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Explore Programs</span>
            </Link>
          </div>
        </div>
      </section>

      {/* CONTACT CARDS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <a href={`mailto:${c.contactEmail || 'admissions@apex.edu'}`} className="group bg-white p-7 rounded-3xl border border-slate-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-4 block">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform"><Mail className="w-7 h-7" /></div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 mb-1">Email Us</p>
              <h3 className="font-black text-slate-900 text-base">Admissions Email</h3>
              <p className="text-sm text-slate-500 font-medium mt-1">{c.contactEmail || 'admissions@apex.edu'}</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600">Send Email <ArrowRight className="w-3.5 h-3.5" /></span>
          </a>

          <a href={`tel:${c.contactPhone || '+18005553739'}`} className="group bg-white p-7 rounded-3xl border border-slate-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-4 block">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform"><Phone className="w-7 h-7" /></div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 mb-1">Call Us</p>
              <h3 className="font-black text-slate-900 text-base">Direct Phone Hotline</h3>
              <p className="text-sm text-slate-500 font-medium mt-1">{c.contactPhone || '+1 (800) 555-APEX'}</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">Call Now <ArrowRight className="w-3.5 h-3.5" /></span>
          </a>

          <div className="group bg-white p-7 rounded-3xl border border-slate-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-200 group-hover:scale-110 transition-transform"><MapPin className="w-7 h-7" /></div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-violet-600 mb-1">Visit Us</p>
              <h3 className="font-black text-slate-900 text-base">Campus Address</h3>
              <p className="text-sm text-slate-500 font-medium mt-1 leading-relaxed">{c.contactAddress || '100 University Boulevard, Tech City, CA 94016'}</p>
            </div>
            <a href="https://www.google.com/maps/search/?api=1&query=Apex+University%2C+Jaipur" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-800 transition-colors">Get Directions <ArrowRight className="w-3.5 h-3.5" /></a>
          </div>
        </div>
      </section>

      {/* OFFICE HOURS + MAP */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><Clock className="w-6 h-6" /></div>
              <div>
                <h3 className="font-black text-slate-900 text-xl">Admissions Office Hours</h3>
                <p className="text-xs text-slate-500">Walk-in advising and phone consultations</p>
              </div>
            </div>
            <div className="divide-y divide-slate-100 text-sm space-y-3 pt-2">
              <div className="flex justify-between py-2"><span className="text-slate-600 font-medium">Monday – Friday</span><span className="font-bold text-slate-900">8:00 AM – 6:00 PM EST</span></div>
              <div className="flex justify-between py-2"><span className="text-slate-600 font-medium">Saturday</span><span className="font-bold text-slate-900">9:00 AM – 2:00 PM EST (By Appointment)</span></div>
              <div className="flex justify-between py-2"><span className="text-slate-600 font-medium">Sunday &amp; Public Holidays</span><span className="font-bold text-rose-500">Closed</span></div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-900">Need urgent assistance?</p>
              <p>Contact our 24/7 student advisory chat or email <a href="mailto:support@apex.edu" className="text-indigo-600 underline font-semibold">support@apex.edu</a>.</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><Compass className="w-6 h-6" /></div>
              <div>
                <h3 className="font-black text-slate-900 text-xl">Campus Visit Guide</h3>
                <p className="text-xs text-slate-500">How to plan your physical arrival</p>
              </div>
            </div>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>📍 <strong>Visitor Parking:</strong> Available at Campus Gate 2 (West Parking Garage). Parking permits are validated at the Admissions Center lobby.</p>
              <p>🚍 <strong>Public Transit:</strong> Metro Line 4 stops directly at Apex Central Station. Free electric shuttle buses run between the station and main academic quadrangles every 10 minutes.</p>
              <p>♿ <strong>Accessibility:</strong> All buildings, parking zones, and tour routes are fully ADA compliant with elevator access and tactile pathways.</p>
            </div>
            <div className="pt-2">
              <a href="https://www.google.com/maps/search/?api=1&query=Apex+University%2C+Jaipur" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl text-xs shadow-md shadow-indigo-200 transition">
                <span>Open Google Maps Directions</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">Got Questions?</span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Frequently Asked Questions</h2>
          <p className="text-slate-500 text-xs sm:text-sm">Find fast answers to common questions regarding admissions and visits.</p>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full p-5 text-left font-bold text-slate-900 text-sm flex items-center justify-between gap-4 hover:text-indigo-600 transition">
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-300 ${openFaq === i ? 'rotate-180 text-indigo-600' : ''}`} />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
