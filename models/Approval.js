const mongoose = require('mongoose');

const ApprovalSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  boq: { type: mongoose.Schema.Types.ObjectId, ref: 'BillOfQuantity', required: true },
  supervisor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  decision: { type: String, enum: ['APPROVED', 'REJECTED'], required: true },
  comment: { type: String },
  decidedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Approval', ApprovalSchema);
