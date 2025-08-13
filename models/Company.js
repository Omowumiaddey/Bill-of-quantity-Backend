const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const CompanySchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: [true, 'Please add a company name'],
    trim: true,
    maxlength: [100, 'Company name cannot be more than 100 characters']
  },
  companyEmail: {
    type: String,
    required: [true, 'Please add a company email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  companyAddress: {
    type: String,
    required: [true, 'Please add a company address']
  },
  companyContactNumber: {
    type: String,
    required: [true, 'Please add a company contact number']
  },
  adminPassword: {
    type: String,
    required: [true, 'Please set admin password'],
    minlength: 6
  },
  companyLogo: {
    type: String // URL to uploaded logo file
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationOTP: {
    type: String
  },
  otpExpires: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt admin password only
CompanySchema.pre('save', async function(next) {
  if (!this.isModified('adminPassword')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.adminPassword = await bcrypt.hash(this.adminPassword, salt);
});

module.exports = mongoose.model('Company', CompanySchema);




