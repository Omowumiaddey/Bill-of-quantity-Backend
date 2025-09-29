const Company = require('../models/Company');
const User = require('../models/User');
const { createOtp, verifyOtp } = require('../utils/otp');
const { sendMail, otpTemplate } = require('../utils/email');


// @desc    Register company
// @route   POST /api/company/register
// @access  Public
exports.registerCompany = async (req, res, next) => {
  try {
    const { companyName, companyEmail, password, ...rest } = req.body;

    // pre-check to give a nicer error before attempting insert
    const existing = await Company.findOne({ companyEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        fieldErrors: { companyEmail: 'Email already in use' },
        fields: { companyName, companyEmail, ...rest }
      });
    }

    const payload = { companyName, companyEmail, password, ...rest };
    const company = await Company.create(payload);

    res.status(201).json({ success: true, data: company });
  } catch (err) {
    // handle Mongo duplicate key error
    if (err && (err.code === 11000 || err.name === 'MongoServerError')) {
      const dupField = Object.keys(err.keyPattern || err.keyValue || { companyEmail: 1 })[0];
      return res.status(409).json({
        success: false,
        fieldErrors: { [dupField]: `${dupField} already exists` },
        error: 'Duplicate key'
      });
    }

    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Verify company OTP
// @route   POST /api/company/verify-otp
// @access  Public
exports.verifyCompanyOTP = async (req, res, next) => {
  try {
    const { companyEmail, otp } = req.body;
    if (!companyEmail || !otp) {
      return res.status(400).json({ success: false, error: 'companyEmail and otp are required' });
    }

    const company = await Company.findOne({ companyEmail: companyEmail.toLowerCase() });
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    const result = await verifyOtp({ subject: 'COMPANY_REG', recipientEmail: company.companyEmail, code: String(otp), metaMatch: { companyId: company._id.toString() } });
    if (!result.ok) {
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
    }

    // Activate company and primary admin
    company.isVerified = true;
    await company.save();

    if (result.otp?.meta?.adminUserId) {
      const adminUser = await User.findById(result.otp.meta.adminUserId);
      if (adminUser) {
        adminUser.isVerified = true;
        adminUser.isPrimaryAdmin = true;
        await adminUser.save();
      }
    }

    res.status(200).json({ success: true, message: 'Company verified successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Check if company email exists
// @route   GET /api/company/check-email
// @access  Public
exports.checkCompanyEmail = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const company = await Company.findOne({ companyEmail: email.toLowerCase() });
    if (company) {
      return res.status(409).json({ success: false, error: 'This email is already in use.' });
    }

    res.status(200).json({ success: true, message: 'Email is available.' });
  } catch (err) {
    next(err);
  }
};

// @desc    Resend company registration OTP
// @route   POST /api/company/resend-otp
// @access  Public
exports.resendCompanyOTP = async (req, res, next) => {
  try {
    const { companyEmail } = req.body;
    if (!companyEmail) {
      return res.status(400).json({ success: false, error: 'companyEmail is required' });
    }

    const company = await Company.findOne({ companyEmail: companyEmail.toLowerCase() });
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }
    if (company.isVerified) {
      return res.status(400).json({ success: false, error: 'Company already verified' });
    }

    const { code } = await createOtp({
      subject: 'COMPANY_REG',
      recipientEmail: company.companyEmail,
      company: company._id,
      meta: { companyId: company._id.toString() }
    });

    const template = otpTemplate({ companyName: company.companyName, code, purpose: 'Company registration' });
    await sendMail({ to: company.companyEmail, subject: template.subject, html: template.html, text: template.text });

    res.status(200).json({ success: true, message: 'OTP resent to company email' });
  } catch (err) {
    const msg = String(err?.message || '');
    if (/Email service is unavailable|ECONNREFUSED|ECONNECTION|ETIMEDOUT|ENOTFOUND/.test(msg)) {
      return res.status(503).json({ success: false, error: 'Email service unavailable. Please try again later.' });
    }
    next(err);
  }
};

// @desc    Get company details
// @route   GET /api/company/:id
// @access  Private
exports.getCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id).select('-adminPassword -userPassword -supervisorPassword');

    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    res.status(200).json({
      success: true,
      data: company
    });
  } catch (err) {
    next(err);
  }
};
