import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import { useAuth } from './context/AuthContext.jsx';

// Code-split secondary routes so initial homepage load is tiny and fast
const ProgramsPage = lazy(() => import('./pages/ProgramsPage.jsx'));
const CampusPage = lazy(() => import('./pages/CampusPage.jsx'));
const ContactPage = lazy(() => import('./pages/ContactPage.jsx'));
const PortalPage = lazy(() => import('./pages/PortalPage.jsx'));
const AdminPage = lazy(() => import('./pages/AdminPage.jsx'));
const FacultyPage = lazy(() => import('./pages/FacultyPage.jsx'));

function PageLoader() {
  return (
    <div className="flex-grow flex items-center justify-center py-24 text-slate-400 font-semibold text-sm">
      <div className="flex items-center gap-3">
        <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-ping" />
        <span>Loading page...</span>
      </div>
    </div>
  );
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
    } else {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [pathname, hash]);

  return null;
}

// Protected route guard for Admin Console
function ProtectedAdminRoute({ children }) {
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser !== undefined) {
      if (!currentUser || !isAdmin) {
        navigate('/', { replace: true });
      }
    }
  }, [currentUser, isAdmin, navigate]);

  if (currentUser === undefined) {
    return (
      <div className="flex-grow flex items-center justify-center py-20 text-slate-400 font-bold text-sm">
        Verifying administrative credentials...
      </div>
    );
  }

  if (!currentUser || !isAdmin) {
    return null;
  }

  return children;
}

// Protected route guard for Faculty Console
function ProtectedFacultyRoute({ children }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser !== undefined) {
      if (!currentUser) {
        navigate('/portal', { replace: true });
      }
    }
  }, [currentUser, navigate]);

  if (currentUser === undefined) {
    return (
      <div className="flex-grow flex items-center justify-center py-20 text-slate-400 font-bold text-sm">
        Verifying faculty credentials...
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return children;
}

export default function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <Navbar />
      <div className="flex-grow flex flex-col">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/programs" element={<ProgramsPage />} />
            <Route path="/campus" element={<CampusPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/portal" element={<PortalPage />} />
            <Route
              path="/faculty"
              element={
                <ProtectedFacultyRoute>
                  <FacultyPage />
                </ProtectedFacultyRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <AdminPage />
                </ProtectedAdminRoute>
              }
            />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}
