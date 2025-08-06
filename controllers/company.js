const Company = require('../models/Company');
const crypto = require('crypto');

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Register company
// @route   POST /api/company/register
// @access  Public
exports.registerCompany = async (req, res, next) => {
  try {
    const {
      companyName,
      companyEmail,
      companyNumber,
      companyLocation,
      adminPassword,
      userPassword,
      supervisorPassword
    } = req.body;

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const company = await Company.create({
      companyName,
      companyEmail,
      companyNumber,
      companyLocation,
      adminPassword,
      userPassword,
      supervisorPassword,
      verificationOTP: otp,
      otpExpires
    });

    // TODO: Send OTP via email
    console.log(`OTP for ${companyEmail}: ${otp}`);

    res.status(201).json({
      success: true,
      message: 'Company registered successfully. Please verify with OTP sent to your email.',
      data: {
        companyId: company._id,
        companyEmail: company.companyEmail
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify company OTP
// @route   POST /api/company/verify-otp
// @access  Public
exports.verifyCompanyOTP = async (req, res, next) => {
  try {
    const { companyEmail, otp } = req.body;

    const company = await Company.findOne({
      companyEmail,
      verificationOTP: otp,
      otpExpires: { $gt: Date.now() }
    });

    if (!company) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP'
      });
    }

    company.isVerified = true;
    company.verificationOTP = undefined;
    company.otpExpires = undefined;
    await company.save();

    res.status(200).json({
      success: true,
      message: 'Company verified successfully'
    });
  } catch (err) {
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