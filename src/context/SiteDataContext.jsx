import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  subscribeSiteContent,
  subscribePrograms,
  getCachedSiteContent,
  getCachedPrograms
} from '../lib/siteData.js';

const SiteDataContext = createContext(null);

export function SiteDataProvider({ children }) {
  const [siteContent, setSiteContent] = useState(() => getCachedSiteContent());
  const [programs, setPrograms] = useState(() => getCachedPrograms());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Single real-time listeners that automatically push initial and updated state
    const unsubContent = subscribeSiteContent((newContent) => {
      if (newContent) setSiteContent(newContent);
    });

    const unsubProgs = subscribePrograms((newProgs) => {
      if (newProgs) setPrograms(newProgs);
    });

    return () => {
      if (unsubContent) unsubContent();
      if (unsubProgs) unsubProgs();
    };
  }, []);

  return (
    <SiteDataContext.Provider value={{ siteContent, programs, loading }}>
      {children}
    </SiteDataContext.Provider>
  );
}

export function useSiteData() {
  const context = useContext(SiteDataContext);
  if (!context) {
    throw new Error('useSiteData must be used within a SiteDataProvider');
  }
  return context;
}
