const SibApiV3Sdk = require('sib-api-v3-sdk');

// Configure API key from env
const defaultClient = SibApiV3Sdk.ApiClient.instance;
defaultClient.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

async function sendMail(toEmail, subject, content) {
  try {
    const senderEmail = process.env.CAMPAIGN_SENDER_EMAIL || process.env.MAIL_FROM || 'no-reply@example.com';
    const senderName = process.env.CAMPAIGN_SENDER_NAME || 'ASL BoQ';

    const sendSmtpEmail = {
      sender: { email: senderEmail, name: senderName },
      to: [{ email: toEmail }],
      subject: subject,
      htmlContent: `<html><body>${content}</body></html>`
    };

    const result = await tranEmailApi.sendTransacEmail(sendSmtpEmail);
    return result;
  } catch (err) {
    // Normalize error body if present
    if (err && err.response && err.response.body) throw err.response.body;
    throw err;
  }
}

module.exports = { sendMail };
