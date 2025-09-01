const express = require('express');
const router = express.Router();
const { sendMailAPI, sendMailSMTP } = require('../services/emailService');

router.post('/send-email-api', async (req, res) => {
  const { email, subject, message } = req.body;
  if (!email || !subject || !message) return res.status(400).json({ error: 'email, subject and message are required' });
  try {
    const result = await sendMailAPI(email, subject, message);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err && err.message ? err.message : err });
  }
});

router.post('/send-email-smtp', async (req, res) => {
  const { email, subject, message } = req.body;
  if (!email || !subject || !message) return res.status(400).json({ error: 'email, subject and message are required' });
  try {
    const result = await sendMailSMTP(email, subject, message);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err && err.message ? err.message : err });
  }
});

module.exports = router;
