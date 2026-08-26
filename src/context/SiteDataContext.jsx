import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getSiteContent,
  getProgramsList,
  subscribeSiteContent,
  subscribePrograms,
  DEFAULT_SITE_CONTENT,
  DEFAULT_PROGRAMS
} from '../lib/siteData.js';

const SiteDataContext = createContext(null);

export function SiteDataProvider({ children }) {
  const [siteContent, setSiteContent] = useState(DEFAULT_SITE_CONTENT);
  const [programs, setPrograms] = useState(DEFAULT_PROGRAMS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubContent;
    let unsubProgs;

    async function initializeData() {
      try {
        const [content, progsList] = await Promise.all([
          getSiteContent(),
          getProgramsList()
        ]);
        if (content) setSiteContent(content);
        if (progsList) setPrograms(progsList);
      } catch (err) {
        console.error("Error loading initial site data:", err);
      } finally {
        setLoading(false);
      }

      unsubContent = subscribeSiteContent((newContent) => {
        if (newContent) setSiteContent(newContent);
      });

      unsubProgs = subscribePrograms((newProgs) => {
        if (newProgs) setPrograms(newProgs);
      });
    }

    initializeData();

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
