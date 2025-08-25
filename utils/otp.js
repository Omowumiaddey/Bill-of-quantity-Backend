const bcrypt = require('bcryptjs');
const Otp = require('../models/Otp');

function generateNumericCode(length = 6) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function createOtp({ subject, recipientEmail, company, meta = {}, ttlMinutes = 10 }) {
  const code = String(generateNumericCode(6));
  const salt = await bcrypt.genSalt(10);
  const codeHash = await bcrypt.hash(code, salt);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  const otp = await Otp.create({ subject, recipientEmail, company, codeHash, expiresAt, meta });
  return { code, otp };
}

async function verifyOtp({ subject, recipientEmail, code, metaMatch = {} }) {
  const now = new Date();
  const otp = await Otp.findOne({ subject, recipientEmail, expiresAt: { $gt: now }, consumedAt: null }).sort({ createdAt: -1 });
  if (!otp) return { ok: false, reason: 'not_found' };

  const match = await bcrypt.compare(String(code), otp.codeHash);
  if (!match) return { ok: false, reason: 'mismatch' };

  // optional meta matching (e.g., pendingUserId)
  for (const key of Object.keys(metaMatch)) {
    if (otp.meta?.[key] !== metaMatch[key]) {
      return { ok: false, reason: 'meta_mismatch' };
    }
  }

  otp.consumedAt = new Date();
  await otp.save();
  return { ok: true, otp };
}

module.exports = { createOtp, verifyOtp };
