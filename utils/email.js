const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  } : undefined,
  tls: {
    rejectUnauthorized: process.env.SMTP_REJECT_UNAUTH === 'true'
  }
});

async function sendMail({ to, subject, html, text }) {
  const from = process.env.MAIL_FROM || 'no-reply@aslboq.local';
  await transporter.sendMail({ from, to, subject, html, text });
}

function otpTemplate({ companyName, code, purpose }) {
  return {
    subject: `${purpose} code for ${companyName || 'ASL BoQ'}`,
    html: `<p>Your verification code is <b>${code}</b>. It expires in 10 minutes.</p>`,
    text: `Your verification code is ${code}. It expires in 10 minutes.`
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
