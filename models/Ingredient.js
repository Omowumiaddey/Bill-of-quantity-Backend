const mongoose = require('mongoose');

const IngredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add an ingredient name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  category: {
    type: mongoose.Schema.ObjectId,
    ref: 'Category',
    required: [true, 'Please specify a category']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Please specify the unit price']
  },
  unit: {
    type: String,
    required: [true, 'Please specify the unit (e.g., kg, g, ml, pieces)']
  },
  currentStock: {
    type: Number,
    required: [true, 'Please specify current stock'],
    default: 0
  },
  minimumStock: {
    type: Number,
    required: [true, 'Please specify minimum stock'],
    default: 0
  },
  status: {
    type: String,
    enum: ['OK', 'Low'],
    default: function() {
      return this.currentStock > this.minimumStock ? 'OK' : 'Low';
    }
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

// Update status before saving
IngredientSchema.pre('save', function(next) {
  this.status = this.currentStock > this.minimumStock ? 'OK' : 'Low';
  next();
});

module.exports = mongoose.model('Ingredient', IngredientSchema);