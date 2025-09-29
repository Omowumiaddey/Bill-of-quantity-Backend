const nodemailer = require('nodemailer');

async function sendMail({ to, subject, html, text }) {
  try {
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

    // Add connection timeouts to avoid hanging requests against a slow SMTP server
    // Values are in milliseconds; tune as needed or override via env
    transporter.options = transporter.options || {};
    transporter.options.connectionTimeout = parseInt(process.env.SMTP_CONNECTION_TIMEOUT || '10000', 10);
    transporter.options.greetingTimeout = parseInt(process.env.SMTP_GREETING_TIMEOUT || '5000', 10);
    transporter.options.socketTimeout = parseInt(process.env.SMTP_SOCKET_TIMEOUT || '20000', 10);

    // Verify transporter early so failures show up quickly
    // This will throw if the connection/auth fails
    await transporter.verify();

    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || 'no-reply@asl-boq.example',
      to,
      subject,
      text,
      html
    });

    console.log('Email sent:', { to, messageId: info.messageId, response: info.response });
    return info;
  } catch (err) {
    console.error('sendMail error:', err && (err.stack || err.message || err));
    // rethrow so callers can handle and your route catch shows it
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

module.exports = {
  sendMail,
  otpTemplate,
  resetTemplate
};
