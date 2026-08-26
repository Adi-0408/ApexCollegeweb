import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, LogIn } from 'lucide-react';

export default function LoginModal({ open, onClose, targetProgram = '' }) {
  if (!open) return null;

  const portalHref = targetProgram
    ? `/portal?program=${encodeURIComponent(targetProgram)}`
    : '/portal';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full p-6 sm:p-8 text-center space-y-5">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900">Student Login Required</h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            You need to log in or create a student account before filling out the admission application.
          </p>
        </div>
        <div className="flex flex-col gap-3 pt-2">
          <Link
            to={portalHref}
            onClick={onClose}
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold py-3.5 rounded-xl shadow-md text-sm transition flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Go to Portal Login</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl text-sm transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
