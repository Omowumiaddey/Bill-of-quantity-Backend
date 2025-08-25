const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
  subject: {
    type: String,
    enum: ['COMPANY_REG', 'USER_REG', 'LOGIN_2FA', 'PASSWORD_RESET'],
    required: true
  },
  recipientEmail: {
    type: String,
    required: true,
    index: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: false
  },
  codeHash: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  consumedAt: {
    type: Date,
    default: null
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Otp', OtpSchema);
