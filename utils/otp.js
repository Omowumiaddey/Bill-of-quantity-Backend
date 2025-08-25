const bcrypt = require('bcryptjs');
const Otp = require('../models/Otp');

function generateNumericCode(length = 6) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function createOtp({ subject, recipientEmail, company, meta = {}, ttlMinutes }) {
  // DB-level rate limiting per recipient/subject within a time window
  const windowMin = parseInt(process.env.OTP_RATE_LIMIT_WINDOW_MIN || '10', 10);
  const maxPerWindow = parseInt(process.env.OTP_RATE_LIMIT_MAX || '5', 10);
  const cutoff = new Date(Date.now() - windowMin * 60 * 1000);
  const recentCount = await Otp.countDocuments({ subject, recipientEmail, createdAt: { $gte: cutoff } });
  if (recentCount >= maxPerWindow) {
    const err = new Error('Too many OTP requests, try again later.');
    err.code = 'OTP_RATE_LIMIT';
    throw err;
  }

  const code = String(generateNumericCode(6));
  const salt = await bcrypt.genSalt(10);
  const codeHash = await bcrypt.hash(code, salt);
  const minutes = Number.isFinite(parseInt(String(ttlMinutes), 10))
    ? parseInt(String(ttlMinutes), 10)
    : parseInt(process.env.OTP_TTL_MINUTES || '10', 10);
  const expiresAt = new Date(Date.now() + minutes * 60 * 1000);

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
