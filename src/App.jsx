import React, { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import ProgramsPage from './pages/ProgramsPage.jsx';
import CampusPage from './pages/CampusPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import PortalPage from './pages/PortalPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import { useAuth } from './context/AuthContext.jsx';

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

export default function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <Navbar />
      <div className="flex-grow flex flex-col">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/programs" element={<ProgramsPage />} />
          <Route path="/campus" element={<CampusPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/portal" element={<PortalPage />} />
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
      </div>
      <Footer />
    </div>
  );
}
