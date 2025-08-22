const BillOfQuantity = require('../models/BillOfQuantity');

// @desc    Get all bills of quantity
// @route   GET /api/bills
// @access  Private
exports.getBills = async (req, res, next) => {
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
    query = BillOfQuantity.find(JSON.parse(queryStr))
      .populate('event', 'eventName eventDate')
      .populate('customer', 'companyName email')
      .populate('menuItems.menu', 'name');

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
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await BillOfQuantity.countDocuments({ company: req.user.company });

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const bills = await query;

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
      count: bills.length,
      pagination,
      data: bills
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single bill of quantity
// @route   GET /api/bills/:id
// @access  Private
exports.getBill = async (req, res, next) => {
  try {
    const bill = await BillOfQuantity.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        error: 'Bill of Quantity not found'
      });
    }

    res.status(200).json({
      success: true,
      data: bill
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new bill of quantity
// @route   POST /api/bills
// @access  Private
exports.createBill = async (req, res, next) => {
  try {
    // Add user and company to req.body
    req.body.createdBy = req.user.id;
    req.body.company = req.user.company;

    const bill = await BillOfQuantity.create(req.body);

    res.status(201).json({
      success: true,
      data: bill
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update bill of quantity
// @route   PUT /api/bills/:id
// @access  Private
exports.updateBill = async (req, res, next) => {
  try {
    let bill = await BillOfQuantity.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        error: 'Bill of Quantity not found'
      });
    }

    // Make sure user is bill owner or admin
    if (bill.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this bill'
      });
    }

    bill = await BillOfQuantity.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: bill
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete bill of quantity
// @route   DELETE /api/bills/:id
// @access  Private
exports.deleteBill = async (req, res, next) => {
  try {
    const bill = await BillOfQuantity.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        error: 'Bill of Quantity not found'
      });
    }

    // Make sure user is bill owner or admin
    if (bill.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to delete this bill'
      });
    }

    await bill.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};
