const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: [true, 'Please add a company name'],
    trim: true
  },
  contactPerson: {
    type: String,
    required: [true, 'Please add a contact person'],
    trim: true
  },
  address: {
    type: String
  },
  email: {
    type: String,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/,
      'Please add a valid email'
    ]
  },
  mobile: {
    type: String,
    required: [true, 'Please add a mobile number']
  },
  twitter: { type: String },
  instagram: { type: String },
  facebook: { type: String },
  discord: { type: String },
  linkedin: { type: String },
  cateringType: { type: String },
  dateJoined: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: mongoose.Schema.ObjectId,
    ref: 'Company',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Customer', CustomerSchema);
