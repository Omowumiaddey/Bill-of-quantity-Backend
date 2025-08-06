const mongoose = require('mongoose');

const MenuIngredientSchema = new mongoose.Schema({
  ingredient: {
    type: mongoose.Schema.ObjectId,
    ref: 'Ingredient',
    required: true
  },
  quantity: {
    type: Number,
    required: [true, 'Please specify quantity needed'],
    min: [0, 'Quantity cannot be negative']
  }
});

const MenuSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a menu item name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  ingredients: [MenuIngredientSchema],
  totalQuantity: {
    type: Number,
    default: 0
  },
  estimatedCost: {
    type: Number,
    default: 0
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

// Calculate total quantity and estimated cost before saving
MenuSchema.pre('save', function(next) {
  if (this.ingredients && this.ingredients.length > 0) {
    this.totalQuantity = this.ingredients.reduce((total, item) => {
      return total + item.quantity;
    }, 0);
  }
  next();
});

module.exports = mongoose.model('Menu', MenuSchema);