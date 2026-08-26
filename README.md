# Apex University Web Application (React.js)

A modern, responsive web application for **Apex University** built with **React 18**, **Vite**, **React Router v6**, **Tailwind CSS**, and **Firebase** (Auth & Firestore).

---

## 🚀 Features

- **Dynamic Homepage**: Hero banner with admissions announcements, real-time statistics counters, featured academic programs, and campus facilities preview.
- **Academic Programs Catalog**: Real-time program listings, full-text search, and category filters (Science & Tech, Business, Engineering).
- **Campus Life & Facilities**: Categorized facilities gallery, campus metrics, residence & dining details, and virtual tour modal.
- **Admissions Office & Contact**: Contact details, office hours, interactive FAQ accordion, and Google Maps campus locator.
- **Student Admission Portal**:
  - Student registration and email login.
  - Admission application form with GPA, degree selection, and contact details.
  - Multi-step accepted student roadmap (Verification Appointment, Campus Housing & Dining, Digital Student ID card).
  - One-click official admission offer letter printing.
- **Admin Management Console** (`/admin`):
  - Protected admin login (`admin@apex.edu`).
  - Applicant review with one-click Accept/Reject and automated EmailJS notifications.
  - Academic Programs CMS (Add, Edit, and Delete degree offerings).
  - Website Content CMS (Customize hero titles, slogans, statistics, facilities, and contact information).

---

## 📁 Directory Structure

```
d:\itpl\p\
├── index.html                   # Vite HTML entry template
├── package.json                 # Dependencies and npm scripts
├── tailwind.config.js           # Tailwind CSS configuration
├── postcss.config.js            # PostCSS plugin settings
├── vite.config.js               # Vite bundler configuration
│
└── src/
    ├── main.jsx                 # Application entry point with Providers
    ├── App.jsx                  # Route definitions and layout structure
    ├── index.css                # Tailwind directives and global typography
    │
    ├── components/              # Shared UI components
    │   ├── Navbar.jsx           # Responsive header with mobile drawer
    │   ├── Footer.jsx           # Dynamic footer with Firestore copyright
    │   └── LoginModal.jsx       # Student authentication prompt modal
    │
    ├── context/                 # React Context providers
    │   ├── AuthContext.jsx      # Firebase Auth state provider
    │   ├── SiteDataContext.jsx  # Firestore site content & programs provider
    │   └── ToastContext.jsx     # Global notification toast provider
    │
    ├── lib/                     # Utilities & Service configurations
    │   ├── firebase.js          # Firebase app, auth, and Firestore init
    │   └── siteData.js          # Local caching and Firestore CRUD helpers
    │
    └── pages/                   # Application route pages
        ├── HomePage.jsx         # Landing page
        ├── ProgramsPage.jsx     # Programs directory with search & filters
        ├── CampusPage.jsx       # Campus life and facilities tour
        ├── ContactPage.jsx      # Admissions contact & FAQ
        ├── PortalPage.jsx       # Student portal & admission roadmap
        └── AdminPage.jsx        # Admin dashboard & CMS manager
```

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build for Production
```bash
npm run build
```
The optimized production bundle will be created in the `dist/` directory.

### 4. Preview the Production Build
```bash
npm run preview
```
