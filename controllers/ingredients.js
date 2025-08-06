const Ingredient = require('../models/Ingredient');

// @desc    Get all ingredients
// @route   GET /api/ingredients
// @access  Private
exports.getIngredients = async (req, res, next) => {
  try {
    const ingredients = await Ingredient.find({ company: req.user.company })
      .populate('category', 'name')
      .populate('createdBy', 'username');

    res.status(200).json({
      success: true,
      count: ingredients.length,
      data: ingredients
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Create new ingredient
// @route   POST /api/ingredients
// @access  Private
exports.createIngredient = async (req, res, next) => {
  try {
    req.body.createdBy = req.user.id;
    req.body.company = req.user.company;

    const ingredient = await Ingredient.create(req.body);

    res.status(201).json({
      success: true,
      data: ingredient
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Update ingredient
// @route   PUT /api/ingredients/:id
// @access  Private
exports.updateIngredient = async (req, res, next) => {
  try {
    const ingredient = await Ingredient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!ingredient) {
      return res.status(404).json({ success: false, error: 'Ingredient not found' });
    }

    res.status(200).json({
      success: true,
      data: ingredient
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Delete ingredient
// @route   DELETE /api/ingredients/:id
// @access  Private (Admin only)
exports.deleteIngredient = async (req, res, next) => {
  try {
    const ingredient = await Ingredient.findById(req.params.id);

    if (!ingredient) {
      return res.status(404).json({ success: false, error: 'Ingredient not found' });
    }

    await ingredient.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Ingredient deleted successfully'
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

