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
  companyNumber: {
    type: String,
    required: [true, 'Please add a company number']
  },
  companyLocation: {
    type: String,
    required: [true, 'Please add a company location']
  },
  companyLogo: {
    type: String // URL to uploaded logo
  },
  adminPassword: {
    type: String,
    required: [true, 'Please set admin password'],
    minlength: 6
  },
  userPassword: {
    type: String,
    required: [true, 'Please set user password'],
    minlength: 6
  },
  supervisorPassword: {
    type: String,
    required: [true, 'Please set supervisor password'],
    minlength: 6
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

// Encrypt passwords using bcrypt
CompanySchema.pre('save', async function(next) {
  if (!this.isModified('adminPassword') && !this.isModified('userPassword') && !this.isModified('supervisorPassword')) {
    next();
  }

  if (this.isModified('adminPassword')) {
    const salt = await bcrypt.genSalt(10);
    this.adminPassword = await bcrypt.hash(this.adminPassword, salt);
  }
  
  if (this.isModified('userPassword')) {
    const salt = await bcrypt.genSalt(10);
    this.userPassword = await bcrypt.hash(this.userPassword, salt);
  }
  
  if (this.isModified('supervisorPassword')) {
    const salt = await bcrypt.genSalt(10);
    this.supervisorPassword = await bcrypt.hash(this.supervisorPassword, salt);
  }
});

module.exports = mongoose.model('Company', CompanySchema);