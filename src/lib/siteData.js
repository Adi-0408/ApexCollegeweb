import {
  db,
  collection,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot
} from './firebase.js';

export const DEFAULT_SITE_CONTENT = {
  brandName: "APEX",
  brandNameSuffix: "UNIVERSITY",
  brandTagline: "Excellence in Education",
  heroBadge: "Admissions Open 2026-27",
  heroTitle: "Shape Your Future at",
  heroTitleHighlight: "Apex University",
  heroSubtitle: "Join a globally recognized institution dedicated to innovation, research, and developing tomorrow's leaders.",
  heroImage: "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=1920&q=80",
  stats: [
    { value: "#12", label: "National Rank" },
    { value: "96%", label: "Graduate Employment" },
    { value: "50+", label: "Academic Majors" },
    { value: "$15M", label: "Scholarships" }
  ],
  programsSectionTitle: "Academic Programs",
  programsSectionSubtitle: "Discover industry-aligned undergraduate and graduate degrees engineered for success.",
  campusSectionBadge: "Life at Apex",
  campusSectionTitle: "Campus Life & World-Class Facilities",
  campusSectionSubtitle: "Experience our athletic complexes, modern dormitories, research centers, and student clubs.",
  facilities: [
    {
      id: "fac_1",
      title: "Knowledge & Innovation Central Library",
      category: "Academic",
      description: "24/7 research hub with 500k+ digital archives, private study pods, collaborative multimedia labs, and cafe.",
      image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80",
      videoUrl: "https://www.youtube.com",
      tags: ["24/7 Access", "Silent Pods", "Digital Archive"]
    },
    {
      id: "fac_2",
      title: "Apex Olympic Athletic & Aquatic Arena",
      category: "Sports",
      description: "Indoor heated 50m Olympic swimming pool, 4,000-seat basketball arena, squash courts, and sports medicine center.",
      image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80",
      videoUrl: "https://www.youtube.com",
      tags: ["Olympic Pool", "NCAA Arena", "Physio Lab"]
    },
    {
      id: "fac_3",
      title: "Robotics & AI Supercomputing Pavilion",
      category: "Research",
      description: "High-performance GPU computing clusters, autonomous drone test cages, robotic arm assembly, and cleanrooms.",
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80",
      videoUrl: "https://www.youtube.com",
      tags: ["GPU Cluster", "Cleanroom", "Drone Arena"]
    },
    {
      id: "fac_4",
      title: "The Apex Foundry (Startup & Maker Hub)",
      category: "Innovation",
      description: "Student startup incubator featuring industrial 3D printing labs, CNC milling, angel pitch stage, and mentor rooms.",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
      videoUrl: "https://www.youtube.com",
      tags: ["3D Printing", "Pitch Stage", "Venture Mentors"]
    },
    {
      id: "fac_5",
      title: "Bio-Tech & Medical Simulation Center",
      category: "Research",
      description: "Virtual reality surgical training suites, genomics DNA sequencers, cell culture cleanrooms, and clinical bays.",
      image: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80",
      videoUrl: "https://www.youtube.com",
      tags: ["VR Surgery", "Genomics Lab", "Clinical Bays"]
    },
    {
      id: "fac_6",
      title: "Apex Performing Arts & Concert Hall",
      category: "Arts",
      description: "1,200-seat acoustically perfected concert hall, Dolby Atmos recording studios, rehearsal halls, and gallery.",
      image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80",
      videoUrl: "https://www.youtube.com",
      tags: ["1200 Seats", "Dolby Sound", "Art Gallery"]
    }
  ],
  contactTitle: "Get in Touch",
  contactSubtitle: "Have questions regarding entry requirements or scholarship options? Submit your inquiry below!",
  contactEmail: "admissions@apex.edu",
  contactPhone: "+1 (800) 555-APEX",
  contactAddress: "100 University Boulevard, Tech City, CA 94016",
  footerCopyright: "© 2026 Apex University Admissions. All rights reserved."
};

export const DEFAULT_PROGRAMS = [
  {
    id: "prog_cs",
    title: "Computer Science & AI",
    degree: "B.S. Degree",
    fullTitle: "B.S. Computer Science & AI",
    description: "Master software engineering, machine learning, cloud computing, and cybersecurity.",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80",
    duration: "4 Years",
    active: true
  },
  {
    id: "prog_bba",
    title: "Business Administration",
    degree: "B.B.A Degree",
    fullTitle: "B.B.A Business Administration",
    description: "Develop strategic management, entrepreneurship, finance, and digital marketing capabilities.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
    duration: "3 Years",
    active: true
  },
  {
    id: "prog_mech",
    title: "Robotics & Mechanical",
    degree: "B.Tech Degree",
    fullTitle: "B.Tech Robotics & Mechanical",
    description: "Hands-on training in automated systems, smart manufacturing, and CAD modeling.",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80",
    duration: "4 Years",
    active: true
  }
];

const LOCAL_STORAGE_SITE_KEY = "apex_site_content_v1";
const LOCAL_STORAGE_PROGS_KEY = "apex_programs_list_v1";

let cachedSiteContent = null;
let cachedPrograms = null;

export async function getSiteContent() {
  if (cachedSiteContent) return cachedSiteContent;
  const localSaved = localStorage.getItem(LOCAL_STORAGE_SITE_KEY);
  let content = localSaved ? JSON.parse(localSaved) : { ...DEFAULT_SITE_CONTENT };
  try {
    const siteDocRef = doc(db, "site_settings", "content");
    const siteSnap = await getDoc(siteDocRef);
    if (siteSnap.exists()) {
      content = { ...DEFAULT_SITE_CONTENT, ...siteSnap.data() };
      localStorage.setItem(LOCAL_STORAGE_SITE_KEY, JSON.stringify(content));
    }
  } catch (err) {
    console.warn("Could not fetch site_settings:", err);
  }
  cachedSiteContent = content;
  return content;
}

export async function saveSiteContent(newContent) {
  const merged = { ...DEFAULT_SITE_CONTENT, ...newContent };
  cachedSiteContent = merged;
  localStorage.setItem(LOCAL_STORAGE_SITE_KEY, JSON.stringify(merged));
  try {
    const siteDocRef = doc(db, "site_settings", "content");
    await setDoc(siteDocRef, merged, { merge: true });
  } catch (err) {
    console.error("Firestore saveSiteContent error:", err);
    throw err;
  }
  return merged;
}

export async function getProgramsList() {
  const localSaved = localStorage.getItem(LOCAL_STORAGE_PROGS_KEY);
  let progs = localSaved ? JSON.parse(localSaved) : [...DEFAULT_PROGRAMS];
  try {
    const snap = await getDocs(collection(db, "programs"));
    if (!snap.empty) {
      progs = [];
      snap.forEach((d) => { progs.push({ id: d.id, ...d.data() }); });
      localStorage.setItem(LOCAL_STORAGE_PROGS_KEY, JSON.stringify(progs));
    } else {
      for (const p of DEFAULT_PROGRAMS) {
        const { id, ...pData } = p;
        await setDoc(doc(db, "programs", id), pData);
      }
      progs = [...DEFAULT_PROGRAMS];
      localStorage.setItem(LOCAL_STORAGE_PROGS_KEY, JSON.stringify(progs));
    }
  } catch (err) {
    console.warn("Could not load programs:", err);
  }
  cachedPrograms = progs;
  return progs;
}

export async function saveProgram(progData, progId = null) {
  try {
    if (progId) {
      await setDoc(doc(db, "programs", progId), progData, { merge: true });
      const current = await getProgramsList();
      const updated = current.map(p => p.id === progId ? { ...p, ...progData, id: progId } : p);
      localStorage.setItem(LOCAL_STORAGE_PROGS_KEY, JSON.stringify(updated));
      return { id: progId, ...progData };
    } else {
      const docRef = await addDoc(collection(db, "programs"), progData);
      const current = await getProgramsList();
      const newProg = { id: docRef.id, ...progData };
      current.push(newProg);
      localStorage.setItem(LOCAL_STORAGE_PROGS_KEY, JSON.stringify(current));
      return newProg;
    }
  } catch (err) {
    console.error("Failed to save program:", err);
    throw err;
  }
}

export async function deleteProgram(progId) {
  try {
    await deleteDoc(doc(db, "programs", progId));
    const current = await getProgramsList();
    const filtered = current.filter(p => p.id !== progId);
    localStorage.setItem(LOCAL_STORAGE_PROGS_KEY, JSON.stringify(filtered));
    return true;
  } catch (err) {
    console.error("Failed to delete program:", err);
    throw err;
  }
}

export function subscribeSiteContent(callback) {
  try {
    return onSnapshot(doc(db, "site_settings", "content"), (snap) => {
      if (snap.exists()) {
        const data = { ...DEFAULT_SITE_CONTENT, ...snap.data() };
        cachedSiteContent = data;
        localStorage.setItem(LOCAL_STORAGE_SITE_KEY, JSON.stringify(data));
        callback(data);
      }
    }, (err) => { console.warn("Site content snapshot warning:", err); });
  } catch (e) {
    console.warn("Snapshot subscription failed:", e);
    return () => {};
  }
}

export function subscribePrograms(callback) {
  try {
    return onSnapshot(collection(db, "programs"), (snap) => {
      if (!snap.empty) {
        const list = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        cachedPrograms = list;
        localStorage.setItem(LOCAL_STORAGE_PROGS_KEY, JSON.stringify(list));
        callback(list);
      }
    }, (err) => { console.warn("Programs snapshot warning:", err); });
  } catch (e) {
    console.warn("Programs subscription failed:", e);
    return () => {};
  }
}
