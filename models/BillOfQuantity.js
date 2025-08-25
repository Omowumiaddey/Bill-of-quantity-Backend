const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  menu: {
    type: mongoose.Schema.ObjectId,
    ref: 'Menu',
    required: true
  },
  quantity: {
    type: Number,
    required: [true, 'Please specify the quantity'],
    min: [1, 'Quantity must be at least 1']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Please specify the unit price']
  },
  totalPrice: {
    type: Number
  }
});

// Calculate total price before saving
MenuItemSchema.pre('save', function(next) {
  this.totalPrice = this.quantity * this.unitPrice;
  next();
});

const BillOfQuantitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  event: {
    type: mongoose.Schema.ObjectId,
    ref: 'Event',
    required: [true, 'BOQ must be linked to an event']
  },
  customer: {
    type: mongoose.Schema.ObjectId,
    ref: 'Customer',
    required: [true, 'BOQ must be linked to a customer']
  },
  menuItems: [MenuItemSchema],
  totalAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'published'],
    default: 'draft'
  },
  company: {
    type: mongoose.Schema.ObjectId,
    ref: 'Company',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate total amount before saving
BillOfQuantitySchema.pre('save', function(next) {
  if (this.menuItems && this.menuItems.length > 0) {
    this.totalAmount = this.menuItems.reduce((total, item) => {
      return total + (item.quantity * item.unitPrice);
    }, 0);
  }
  next();
});

module.exports = mongoose.model('BillOfQuantity', BillOfQuantitySchema);
