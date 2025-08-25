const User = require('../models/User');
const Company = require('../models/Company');
const PasswordResetToken = require('../models/PasswordResetToken');
const { createOtp, verifyOtp } = require('../utils/otp');
const { sendMail, otpTemplate, resetTemplate } = require('../utils/email');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

function signAccessToken(user) {
  const payload = { id: user._id, company: user.company, role: user.role };
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRE || '15m';
  return jwt.sign(payload, secret, { expiresIn });
}

function signRefreshToken(user) {
  const payload = { id: user._id, type: 'refresh' };
  const secret = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRE || '30d';
  return jwt.sign(payload, secret, { expiresIn });
}

function setRefreshCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  const maxAgeMs = parseExpiryMs(process.env.REFRESH_TOKEN_EXPIRE || '30d');
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: maxAgeMs
  });
}

function clearRefreshCookie(res) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', '', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    expires: new Date(0)
  });
}

function parseExpiryMs(expr) {
  // basic parser for 30d, 12h, 15m
  const m = /^([0-9]+)([smhd])$/.exec(String(expr));
  if (!m) return 30 * 24 * 60 * 60 * 1000;
  const n = parseInt(m[1], 10);
  const unit = m[2];
  const mult = unit === 's' ? 1000 : unit === 'm' ? 60 * 1000 : unit === 'h' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  return n * mult;
}

function sendAuthResponse({ user, statusCode = 200, res, remember = false }) {
  const accessToken = signAccessToken(user);
  if (remember) {
    const refreshToken = signRefreshToken(user);
    setRefreshCookie(res, refreshToken);
  } else {
    clearRefreshCookie(res);
  }

  res.status(statusCode).json({
    success: true,
    token: accessToken,
    data: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      company: user.company,
      firstName: user.firstName,
      lastName: user.lastName,
      isVerified: user.isVerified,
      isActive: user.isActive,
      forceLogoutOnClose: user.forceLogoutOnClose
    }
  });
}

// POST /api/auth/register
// Self-registration with company email OTP approval
exports.register = async (req, res) => {
  try {
    const {
      companyEmail,
      desiredRole,
      personalEmail,
      password,
      firstName,
      lastName,
      username
    } = req.body;

    // Backward-compatible path: if company/id provided directly
    if (req.body.company && req.body.role && req.body.email && req.body.password) {
      const user = await User.create({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        role: req.body.role,
        company: req.body.company,
        isVerified: true
      });
      return sendAuthResponse({ user, statusCode: 201, res, remember: !user.forceLogoutOnClose });
    }

    if (!companyEmail || !desiredRole || !password) {
      return res.status(400).json({ success: false, error: 'companyEmail, desiredRole and password are required' });
    }

    const company = await Company.findOne({ companyEmail: companyEmail.toLowerCase() });
    if (!company || !company.isVerified) {
      return res.status(404).json({ success: false, error: 'Company not found or not verified' });
    }

    const email = (personalEmail || '').toLowerCase();
    const userDoc = await User.create({
      username: username || (email ? email.split('@')[0] : `user_${Date.now()}`),
      email: email || companyEmail.toLowerCase(),
      password,
      firstName: firstName || null,
      lastName: lastName || null,
      role: String(desiredRole).toLowerCase(),
      company: company._id,
      isVerified: false,
      isActive: true
    });

    const { code } = await createOtp({
      subject: 'USER_REG',
      recipientEmail: company.companyEmail,
      company: company._id,
      meta: { pendingUserId: userDoc._id.toString() },
      ttlMinutes: 10
    });

    const template = otpTemplate({ companyName: company.companyName, code, purpose: 'User registration' });
    await sendMail({ to: company.companyEmail, subject: template.subject, html: template.html, text: template.text });

    res.status(201).json({ success: true, message: 'Pending user created. Verify OTP sent to company email.', data: { pendingUserId: userDoc._id } });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// POST /api/auth/verify-otp
// body: { pendingUserId, code }
exports.verifyUserOTP = async (req, res) => {
  try {
    const { pendingUserId, code } = req.body;
    if (!pendingUserId || !code) {
      return res.status(400).json({ success: false, error: 'pendingUserId and code are required' });
    }

    const user = await User.findById(pendingUserId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    const company = await Company.findById(user.company);

    const result = await verifyOtp({ subject: 'USER_REG', recipientEmail: company.companyEmail, code: String(code), metaMatch: { pendingUserId } });
    if (!result.ok) return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });

    user.isVerified = true;
    await user.save();

    return sendAuthResponse({ user, statusCode: 200, res, remember: !user.forceLogoutOnClose });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide an email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) return res.status(401).json({ success: false, error: 'Invalid user' });
    if (!user.isActive) return res.status(403).json({ success: false, error: 'User is deactivated' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ success: false, error: 'Invalid password' });

    const remember = typeof rememberMe === 'boolean' ? rememberMe : !user.forceLogoutOnClose;
    return sendAuthResponse({ user, statusCode: 200, res, remember });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('company');
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// GET /api/auth/logout
exports.logout = async (req, res) => {
  try {
    clearRefreshCookie(res);
    res.status(200).json({ success: true, message: 'User logged out successfully' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email, companyEmail } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required' });

    const criteria = { email: email.toLowerCase() };
    if (companyEmail) {
      const company = await Company.findOne({ companyEmail: companyEmail.toLowerCase() });
      if (!company) return res.status(404).json({ success: false, error: 'Company not found' });
      criteria.company = company._id;
    }

    const user = await User.findOne(criteria);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + (parseExpiryMs(process.env.RESET_TOKEN_EXPIRE || '30m')));

    await PasswordResetToken.create({ user: user._id, tokenHash, expiresAt });

    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
    const link = `${frontendBase.replace(/\/$/, '')}/reset?token=${rawToken}`;
    const template = resetTemplate({ companyName: (await Company.findById(user.company))?.companyName, link });
    await sendMail({ to: user.email, subject: template.subject, html: template.html, text: template.text });

    res.status(200).json({ success: true, message: 'Password reset link sent if the user exists' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ success: false, error: 'token and newPassword are required' });

    const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');
    const doc = await PasswordResetToken.findOne({ tokenHash, usedAt: null, expiresAt: { $gt: new Date() } });
    if (!doc) return res.status(400).json({ success: false, error: 'Invalid or expired token' });

    const user = await User.findById(doc.user).select('+password');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    user.password = newPassword;
    await user.save();

    doc.usedAt = new Date();
    await doc.save();

    clearRefreshCookie(res);
    res.status(200).json({ success: true, message: 'Password updated. Please login.' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// PATCH /api/users/:id/preferences
exports.updatePreferences = async (req, res) => {
  try {
    const { id } = req.params;
    const { forceLogoutOnClose } = req.body;

    if (String(req.user._id) !== String(id)) {
      return res.status(403).json({ success: false, error: 'Cannot modify preferences for other users' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    if (typeof forceLogoutOnClose === 'boolean') {
      user.forceLogoutOnClose = forceLogoutOnClose;
    }
    await user.save();

    res.status(200).json({ success: true, data: { forceLogoutOnClose: user.forceLogoutOnClose } });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
