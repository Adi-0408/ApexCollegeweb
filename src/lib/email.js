import emailjs from '@emailjs/browser';

export const EMAILJS_SERVICE_ID = 'service_60i44wa';
export const EMAILJS_TEMPLATE_ID = 'template_tgni47e';
export const EMAILJS_PUBLIC_KEY = 'F7lhTuYimbsHgSMK5';

// Initialize EmailJS immediately
try {
  emailjs.init({
    publicKey: EMAILJS_PUBLIC_KEY,
    blockHeadless: false,
  });
} catch (e) {
  try {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  } catch (err) {
    console.warn('EmailJS init warning:', err);
  }
}

/**
 * Sends application status update email to the student
 */
export async function sendApplicationStatusEmail({ to_email, student_name, program_name, status }) {
  if (!to_email) {
    console.warn('sendApplicationStatusEmail: No recipient email provided');
    return { success: false, error: 'No recipient email provided' };
  }

  const templateParams = {
    to_email: to_email.trim(),
    email: to_email.trim(),
    user_email: to_email.trim(),
    recipient: to_email.trim(),
    student_name: student_name || 'Applicant',
    to_name: student_name || 'Applicant',
    name: student_name || 'Applicant',
    program_name: program_name || 'Degree Program',
    program: program_name || 'Degree Program',
    status: status || 'Updated',
    decision_status: status || 'Updated',
    message: `Your admission application for ${program_name || 'Apex University'} has been marked as: ${status}. Please log in to your Student Portal to view your updated roadmap.`,
    subject: `Apex University Admissions Update: ${status}`,
    year: '2026',
    university_name: 'Apex University'
  };

  try {
    console.log('Sending EmailJS notification to:', to_email, templateParams);
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );
    console.log('EmailJS delivery success:', response.status, response.text);
    return { success: true, status: response.status, text: response.text };
  } catch (error) {
    console.error('EmailJS delivery failed:', error);
    return { success: false, error: error?.text || error?.message || 'Unknown email error' };
  }
}

/**
 * Sends application submission confirmation email
 */
export async function sendApplicationSubmissionEmail({ to_email, student_name, program_name }) {
  if (!to_email) return { success: false };

  const templateParams = {
    to_email: to_email.trim(),
    email: to_email.trim(),
    user_email: to_email.trim(),
    recipient: to_email.trim(),
    student_name: student_name || 'Applicant',
    to_name: student_name || 'Applicant',
    name: student_name || 'Applicant',
    program_name: program_name || 'Degree Program',
    program: program_name || 'Degree Program',
    status: 'Application Submitted (Under Review)',
    decision_status: 'Under Review',
    message: `Thank you for applying to Apex University for ${program_name || 'our degree program'}. Your application has been received and is currently under review by the Admissions Committee.`,
    subject: 'Apex University: Application Received',
    year: '2026',
    university_name: 'Apex University'
  };

  try {
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );
    return { success: true, status: response.status };
  } catch (error) {
    console.error('EmailJS submission notice error:', error);
    return { success: false, error };
  }
}
