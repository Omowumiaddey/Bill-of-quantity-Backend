const brevoModule = require("@getbrevo/brevo");
const brevo = brevoModule.default || brevoModule;
const nodemailer = require("nodemailer");

// Configure Brevo API client and API key (support @getbrevo/brevo v3 and legacy shapes)
let tranEmailApi = null;
try {
  const apiKey =
    process.env.BREVO_API_KEY ||
    process.env.SIB_API_KEY ||
    process.env.BREVO_APIKEY;
  tranEmailApi = new brevo.TransactionalEmailsApi();

  if (apiKey) {
    // Newer SDK pattern
    if (
      typeof tranEmailApi.setApiKey === "function" &&
      brevo.TransactionalEmailsApiApiKeys
    ) {
      tranEmailApi.setApiKey(
        brevo.TransactionalEmailsApiApiKeys.apiKey,
        apiKey
      );
      // Some builds expose authentications on the instance
    } else if (
      tranEmailApi.authentications &&
      (tranEmailApi.authentications.apiKey ||
        tranEmailApi.authentications["api-key"])
    ) {
      const authName = tranEmailApi.authentications.apiKey
        ? "apiKey"
        : "api-key";
      tranEmailApi.authentications[authName].apiKey = apiKey;
      // Legacy singleton client shape
    } else if (brevo.ApiClient && brevo.ApiClient.instance) {
      const defaultClient = brevo.ApiClient.instance;
      const authName = defaultClient.authentications.apiKey
        ? "apiKey"
        : "api-key";
      defaultClient.authentications[authName].apiKey = apiKey;
    }
  }
} catch (e) {
  tranEmailApi = null;
}

// Prepare SMTP transporter if SMTP envs are present
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendMailAPI(toEmail, subject, content) {
  try {
    if (!tranEmailApi || typeof tranEmailApi.sendTransacEmail !== "function") {
      throw new Error(
        "Email service is unavailable: transactional API not initialized"
      );
    }
    const senderEmail =
      process.env.CAMPAIGN_SENDER_EMAIL ||
      process.env.MAIL_FROM ||
      "consult@aslbusinesssolutions.com";
    const senderName = process.env.CAMPAIGN_SENDER_NAME || "ASL BoQ";

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
  if (!transporter)
    throw new Error(
      "SMTP is not configured (missing SMTP_HOST/SMTP_USER/SMTP_PASS)"
    );
  try {
    const from = process.env.MAIL_FROM || process.env.SMTP_USER;
    const info = await transporter.sendMail({
      from: `"${process.env.CAMPAIGN_SENDER_NAME || "ASL BoQ"}" <${from}>`,
      to: toEmail,
      subject: subject,
      html: `<div>${content}</div>`,
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
  sendMail: sendMailAPI,
};
