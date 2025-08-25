const mongoose = require('mongoose');

const PasswordResetTokenSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tokenHash: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true, index: true },
  usedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('PasswordResetToken', PasswordResetTokenSchema);
