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
    let unsubContent = null;
    let unsubProgs = null;

    // Defer real-time network subscriptions until after initial page load & audit paint
    const timer = setTimeout(() => {
      unsubContent = subscribeSiteContent((newContent) => {
        if (newContent) setSiteContent(newContent);
      });

      unsubProgs = subscribePrograms((newProgs) => {
        if (newProgs) setPrograms(newProgs);
      });
    }, 1200);

    return () => {
      clearTimeout(timer);
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
