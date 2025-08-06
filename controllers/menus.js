const Menu = require('../models/Menu');
const Ingredient = require('../models/Ingredient');

// @desc    Get all menus
// @route   GET /api/menus
// @access  Private
exports.getMenus = async (req, res, next) => {
  try {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Filter by company
    reqQuery.company = req.user.company;

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    query = Menu.find(JSON.parse(queryStr)).populate('ingredients.ingredient', 'name unit unitPrice');

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('name');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Menu.countDocuments({ company: req.user.company });

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const menus = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: menus.length,
      pagination,
      data: menus
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single menu
// @route   GET /api/menus/:id
// @access  Private
exports.getMenu = async (req, res, next) => {
  try {
    const menu = await Menu.findOne({
      _id: req.params.id,
      company: req.user.company
    }).populate('ingredients.ingredient', 'name unit unitPrice');

    if (!menu) {
      return res.status(404).json({
        success: false,
        error: 'Menu not found'
      });
    }

    res.status(200).json({
      success: true,
      data: menu
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new menu
// @route   POST /api/menus
// @access  Private
exports.createMenu = async (req, res, next) => {
  try {
    // Add user and company to req.body
    req.body.createdBy = req.user.id;
    req.body.company = req.user.company;

    // Calculate estimated cost based on ingredients
    if (req.body.ingredients && req.body.ingredients.length > 0) {
      let estimatedCost = 0;
      
      for (let item of req.body.ingredients) {
        const ingredient = await Ingredient.findById(item.ingredient);
        if (ingredient) {
          estimatedCost += ingredient.unitPrice * item.quantity;
        }
      }
      
      req.body.estimatedCost = estimatedCost;
    }

    const menu = await Menu.create(req.body);

    res.status(201).json({
      success: true,
      data: menu
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update menu
// @route   PUT /api/menus/:id
// @access  Private
exports.updateMenu = async (req, res, next) => {
  try {
    let menu = await Menu.findOne({
      _id: req.params.id,
      company: req.user.company
    });

    if (!menu) {
      return res.status(404).json({
        success: false,
        error: 'Menu not found'
      });
    }

    // Make sure user is menu owner or admin
    if (menu.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this menu'
      });
    }

    // Recalculate estimated cost if ingredients are updated
    if (req.body.ingredients && req.body.ingredients.length > 0) {
      let estimatedCost = 0;
      
      for (let item of req.body.ingredients) {
        const ingredient = await Ingredient.findById(item.ingredient);
        if (ingredient) {
          estimatedCost += ingredient.unitPrice * item.quantity;
        }
      }
      
      req.body.estimatedCost = estimatedCost;
    }

    menu = await Menu.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: menu
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete menu
// @route   DELETE /api/menus/:id
// @access  Private (Admin only)
exports.deleteMenu = async (req, res, next) => {
  try {
    const menu = await Menu.findOne({
      _id: req.params.id,
      company: req.user.company
    });

    if (!menu) {
      return res.status(404).json({
        success: false,
        error: 'Menu not found'
      });
    }

    await menu.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};