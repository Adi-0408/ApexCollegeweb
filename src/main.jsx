import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { SiteDataProvider } from './context/SiteDataContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SiteDataProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </SiteDataProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
