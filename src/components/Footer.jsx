import React from 'react';
import { Link } from 'react-router-dom';
import { useSiteData } from '../context/SiteDataContext.jsx';

export default function Footer() {
  const { siteContent } = useSiteData();
  const copyright = siteContent?.footerCopyright || '© 2026 Apex University Admissions. All rights reserved.';

  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-10 text-center text-xs w-full mt-auto">
      <div className="max-w-7xl mx-auto px-4 space-y-4">
        <div className="flex flex-wrap justify-center gap-2 sm:gap-6 text-xs text-slate-400">
          <Link to="/" className="py-2.5 px-3 inline-block rounded-lg hover:text-white transition">Home</Link>
          <Link to="/programs" className="py-2.5 px-3 inline-block rounded-lg hover:text-white transition">Academic Programs</Link>
          <Link to="/campus" className="py-2.5 px-3 inline-block rounded-lg hover:text-white transition">Campus Life</Link>
          <Link to="/contact" className="py-2.5 px-3 inline-block rounded-lg hover:text-white transition">Admissions Office</Link>
          <Link to="/portal" className="py-2.5 px-3 inline-block rounded-lg hover:text-white transition">Student Portal</Link>
          <Link to="/admin" className="py-2.5 px-3 inline-block rounded-lg hover:text-white transition opacity-60 hover:opacity-100">Admin Console</Link>
        </div>
        <p>{copyright}</p>
      </div>
    </footer>
  );
}
