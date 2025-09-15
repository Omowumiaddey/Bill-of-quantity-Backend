const brevo = require('@getbrevo/brevo');
const nodemailer = require('nodemailer');

// Configure Brevo API key from env
const defaultClient = brevo.ApiClient.instance;
if (process.env.BREVO_API_KEY) {
  defaultClient.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;
}

const tranEmailApi = new brevo.TransactionalEmailsApi();

// Prepare SMTP transporter if SMTP envs are present
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: (process.env.SMTP_SECURE === 'true'),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

async function sendMailAPI(toEmail, subject, content) {
  try {
    const senderEmail = process.env.CAMPAIGN_SENDER_EMAIL || process.env.MAIL_FROM || 'no-reply@example.com';
    const senderName = process.env.CAMPAIGN_SENDER_NAME || 'ASL BoQ';

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { email: senderEmail, name: senderName };
    sendSmtpEmail.to = [{ email: toEmail }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = `<html><body>${content}</body></html>`;

    const result = await tranEmailApi.sendTransacEmail(sendSmtpEmail);
    return result;
  } catch (err) {
    if (err && err.response && err.response.body) throw err.response.body;
    throw err;
  }
}

async function sendMailSMTP(toEmail, subject, content) {
  if (!transporter) throw new Error('SMTP is not configured (missing SMTP_HOST/SMTP_USER/SMTP_PASS)');
  try {
    const from = process.env.MAIL_FROM || process.env.SMTP_USER;
    const info = await transporter.sendMail({
      from: `"${process.env.CAMPAIGN_SENDER_NAME || 'ASL BoQ'}" <${from}>`,
      to: toEmail,
      subject: subject,
      html: `<div>${content}</div>`
    });
    return info;
  } catch (err) {
    throw err;
  }
}

// Default export kept for backwards compatibility (uses API if available)
module.exports = {
  sendMailAPI,
  sendMailSMTP,
  sendMail: sendMailAPI
};
