const Company = require('../models/Company');
const User = require('../models/User');
const { createOtp, verifyOtp } = require('../utils/otp');
const { sendMail, otpTemplate } = require('../utils/email');


// @desc    Register company
// @route   POST /api/company/register
// @access  Public
exports.registerCompany = async (req, res, next) => {
  try {
    const {
      companyName,
      companyEmail,
      adminEmail,
      companyAddress,
      companyContactNumber,
      adminPassword,
      companyLogo: companyLogoBody
    } = req.body;

    // If multipart/form-data was used and a file was uploaded, prefer it
    let companyLogo = companyLogoBody;
    if (req.file) {
      // Build a public URL to the uploaded file
      const protocol = req.protocol;
      const host = req.get('host');
      const baseUrl = `${protocol}://${host}`;
      companyLogo = `${baseUrl}/uploads/${req.file.filename}`;
    }

    // Create company in unverified state (adminPassword hashed by model)
    const company = await Company.create({
      companyName,
      companyEmail: companyEmail.toLowerCase(),
      companyAddress,
      companyContactNumber,
      adminPassword,
      companyLogo,
      isVerified: false
    });

    // Create primary admin user (unverified)
    const usernameSource = (adminEmail || companyEmail || '');
    const username = usernameSource.split('@')[0] || `admin_${Date.now()}`;
    const adminUser = await User.create({
      username,
      email: (adminEmail || companyEmail).toLowerCase(),
      password: adminPassword,
      role: 'admin',
      company: company._id,
      isVerified: false,
      isPrimaryAdmin: false
    });

    // Generate OTP via centralized service
    const { code } = await createOtp({
      subject: 'COMPANY_REG',
      recipientEmail: company.companyEmail,
      company: company._id,
      meta: { companyId: company._id.toString(), adminUserId: adminUser._id.toString() },
      ttlMinutes: 10
    });

    // Send OTP email
    const template = otpTemplate({ companyName: company.companyName, code, purpose: 'Company registration' });
    await sendMail({ to: company.companyEmail, subject: template.subject, html: template.html, text: template.text });

    res.status(201).json({
      success: true,
      message: 'Company registered. Verify with OTP sent to company email to activate.',
      data: { companyId: company._id, companyEmail: company.companyEmail, adminUserId: adminUser._id }
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

