export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  REGISTRAR: 'registrar',
  PRINCIPAL: 'principal',
  HOD: 'hod',
  FACULTY: 'faculty',
  EXAM_CELL: 'exam_cell',
  ACCOUNTS: 'accounts',
  STUDENT: 'student',
};

export const ROLE_CATALOG = [
  {
    id: ROLES.SUPER_ADMIN,
    label: 'Super Admin',
    job: 'Academic year, departments, courses, subjects, staff accounts, system config',
    scope: 'Full system',
  },
  {
    id: ROLES.REGISTRAR,
    label: 'Registrar / Admin Staff',
    job: 'Admissions processing, document verification, enrollment, notices, ID cards',
    scope: 'Student records',
  },
  {
    id: ROLES.PRINCIPAL,
    label: 'Principal / Dean',
    job: 'Final sign-off on results, faculty appointments, admissions exceptions, dashboards',
    scope: 'All data, top-level approvals',
  },
  {
    id: ROLES.HOD,
    label: 'HOD',
    job: 'Assign faculty to subjects/sections, approve internal marks, department reports',
    scope: 'Own department',
  },
  {
    id: ROLES.FACULTY,
    label: 'Faculty',
    job: 'Attendance, course materials, assignments, internal tests, marks entry',
    scope: 'Own sections',
  },
  {
    id: ROLES.EXAM_CELL,
    label: 'Exam Cell',
    job: 'Scheduling, hall tickets, marks compilation, GPA, publishing, revaluation',
    scope: 'Exam & result modules',
  },
  {
    id: ROLES.ACCOUNTS,
    label: 'Accounts',
    job: 'Fee structure, invoicing, payments, receipts, dues tracking',
    scope: 'Financial records',
  },
  {
    id: ROLES.STUDENT,
    label: 'Student',
    job: 'Profile, attendance, timetable, assignments, fee payment, results, requests',
    scope: 'Own record only',
  },
];

export const STAFF_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.REGISTRAR,
  ROLES.PRINCIPAL,
  ROLES.HOD,
  ROLES.FACULTY,
  ROLES.EXAM_CELL,
  ROLES.ACCOUNTS,
];

export const CONSOLE_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.REGISTRAR,
  ROLES.PRINCIPAL,
  ROLES.HOD,
  ROLES.EXAM_CELL,
  ROLES.ACCOUNTS,
];

const PERMISSIONS = {
  academic_setup: [ROLES.SUPER_ADMIN],
  staff_accounts: [ROLES.SUPER_ADMIN, ROLES.PRINCIPAL],
  cms: [ROLES.SUPER_ADMIN],
  programs: [ROLES.SUPER_ADMIN, ROLES.REGISTRAR],
  admissions: [ROLES.SUPER_ADMIN, ROLES.REGISTRAR, ROLES.PRINCIPAL],
  admissions_exception: [ROLES.PRINCIPAL, ROLES.SUPER_ADMIN],
  enrollment: [ROLES.SUPER_ADMIN, ROLES.REGISTRAR, ROLES.ACCOUNTS],
  fees: [ROLES.SUPER_ADMIN, ROLES.ACCOUNTS],
  assign_faculty: [ROLES.SUPER_ADMIN, ROLES.HOD],
  internal_marks_enter: [ROLES.FACULTY, ROLES.HOD],
  internal_marks_lock: [ROLES.HOD, ROLES.SUPER_ADMIN],
  attendance: [ROLES.FACULTY, ROLES.HOD],
  exams: [ROLES.SUPER_ADMIN, ROLES.EXAM_CELL],
  hall_tickets: [ROLES.EXAM_CELL, ROLES.SUPER_ADMIN],
  compile_results: [ROLES.EXAM_CELL, ROLES.SUPER_ADMIN],
  results_signoff: [ROLES.PRINCIPAL, ROLES.SUPER_ADMIN],
  results_publish: [ROLES.EXAM_CELL, ROLES.SUPER_ADMIN],
  revaluation: [ROLES.EXAM_CELL, ROLES.FACULTY, ROLES.SUPER_ADMIN],
  audit_trail: [ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.EXAM_CELL, ROLES.HOD],
  dashboards: [ROLES.SUPER_ADMIN, ROLES.PRINCIPAL, ROLES.HOD],
  faculty_console: [ROLES.FACULTY, ROLES.HOD],
  staff_console: CONSOLE_ROLES,
};

export function can(role, permission) {
  if (!role || !permission) return false;
  if (role === ROLES.SUPER_ADMIN) return true;
  const allowed = PERMISSIONS[permission] || [];
  return allowed.includes(role);
}

export function roleLabel(roleId) {
  return ROLE_CATALOG.find((r) => r.id === roleId)?.label || roleId || 'Unknown';
}

export function isStaffRole(role) {
  return STAFF_ROLES.includes(role);
}

export function canAccessStaffConsole(role) {
  return CONSOLE_ROLES.includes(role);
}

export function getStaffHomeRoute(role) {
  if (role === ROLES.FACULTY) return '/faculty';
  if (canAccessStaffConsole(role)) return '/admin';
  return '/portal';
}

export function normalizeSystemRole(raw, { isMasterAdmin = false, hasFacultyRecord = false } = {}) {
  if (isMasterAdmin) return ROLES.SUPER_ADMIN;
  const value = String(raw || '').trim().toLowerCase().replace(/[\s/-]+/g, '_');

  const aliases = {
    super_admin: ROLES.SUPER_ADMIN,
    superadmin: ROLES.SUPER_ADMIN,
    admin: ROLES.SUPER_ADMIN,
    master_admin: ROLES.SUPER_ADMIN,
    registrar: ROLES.REGISTRAR,
    admin_staff: ROLES.REGISTRAR,
    admissions_assistant: ROLES.REGISTRAR,
    admissions_assistant_user: ROLES.REGISTRAR,
    sub_admin: ROLES.REGISTRAR,
    principal: ROLES.PRINCIPAL,
    dean: ROLES.PRINCIPAL,
    hod: ROLES.HOD,
    faculty_head: ROLES.HOD,
    head_of_department: ROLES.HOD,
    faculty: ROLES.FACULTY,
    teacher: ROLES.FACULTY,
    professor: ROLES.FACULTY,
    exam_cell: ROLES.EXAM_CELL,
    exam_controller: ROLES.EXAM_CELL,
    accounts: ROLES.ACCOUNTS,
    accountant: ROLES.ACCOUNTS,
    student: ROLES.STUDENT,
  };

  if (aliases[value]) return aliases[value];
  if (value.includes('exam')) return ROLES.EXAM_CELL;
  if (value.includes('account') || value.includes('fee')) return ROLES.ACCOUNTS;
  if (value.includes('principal') || value.includes('dean')) return ROLES.PRINCIPAL;
  if (value.includes('registrar') || value.includes('admission')) return ROLES.REGISTRAR;
  if (value.includes('hod') || value.includes('head')) return ROLES.HOD;
  if (hasFacultyRecord) return ROLES.FACULTY;
  return ROLES.STUDENT;
}

export function subjectCodeFromLabel(label = '') {
  const text = String(label).trim();
  if (!text) return '';
  const beforeDash = text.split(' - ')[0].trim();
  return beforeDash.split(' ')[0].trim().toUpperCase();
}

export function facultyOwnsSubject(assignedSubjects = [], subjectLabel = '') {
  if (!assignedSubjects.length) return false;
  const targetCode = subjectCodeFromLabel(subjectLabel);
  const targetNorm = String(subjectLabel).trim().toLowerCase();
  return assignedSubjects.some((item) => {
    const raw = String(item).trim();
    if (!raw) return false;
    if (raw.toLowerCase() === targetNorm) return true;
    const code = subjectCodeFromLabel(raw);
    return code && targetCode && code === targetCode;
  });
}
