const express = require('express');
const router = express.Router();
const { sendMail } = require('../services/emailService');

router.post('/send-email', async (req, res) => {
  const { email, subject, message } = req.body;
  if (!email || !subject || !message) return res.status(400).json({ error: 'email, subject and message are required' });
  try {
    const result = await sendMail(email, subject, message);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err && err.message ? err.message : err });
  }
});

module.exports = router;
