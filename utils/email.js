const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: String(process.env.SMTP_SECURE || 'false') === 'true',
  auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  } : undefined,
  tls: {
    // In production, certificates should be valid; allow override via env
    rejectUnauthorized: process.env.SMTP_REJECT_UNAUTH
      ? String(process.env.SMTP_REJECT_UNAUTH) === 'true'
      : true
  }
});

async function sendMail({ to, subject, html, text }) {
  const fromEmail = process.env.SMTP_FROM || process.env.MAIL_FROM || 'no-reply@aslboq.local';
  const fromName = process.env.SMTP_FROM_NAME || 'ASL BOQ';
  const from = `${fromName} <${fromEmail}>`;
  try {
    await transporter.sendMail({ from, to, subject, html, text });
  } catch (err) {
    const connectionRefused = err.code === 'ECONNECTION' || err.code === 'ECONNREFUSED';
    const hostname = process.env.SMTP_HOST || 'undefined';
    const port = process.env.SMTP_PORT || 'undefined';
    if (connectionRefused) {
      const msg = `Email service is unavailable (SMTP connection refused to ${hostname}:${port}).`;
      err.message = msg;
    }
    throw err;
  }
}

function otpTemplate({ companyName, code, purpose }) {
  return {
    subject: `${purpose} code for ${companyName || 'ASL BoQ'}`,
    html: `<p>Your verification code is <b>${code}</b>. It expires in ${process.env.OTP_TTL_MINUTES || 10} minutes.</p>`,
    text: `Your verification code is ${code}. It expires in ${process.env.OTP_TTL_MINUTES || 10} minutes.`
  };
}

function resetTemplate({ companyName, link }) {
  return {
    subject: `Password reset for ${companyName || 'ASL BoQ'}`,
    html: `<p>Click the link to reset your password: <a href="${link}">${link}</a>. This link expires soon.</p>`,
    text: `Reset your password using this link: ${link}`
  };
}

module.exports = { sendMail, otpTemplate, resetTemplate };
