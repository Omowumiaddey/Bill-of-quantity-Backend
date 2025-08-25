const BillOfQuantity = require('../models/BillOfQuantity');
const Approval = require('../models/Approval');

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
    const bill = await BillOfQuantity.findOne({ _id: req.params.id, company: req.user.company })
      .populate('event', 'eventName eventDate')
      .populate('customer', 'companyName email')
      .populate('menuItems.menu', 'name');

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

    if (!bill || String(bill.company) !== String(req.user.company)) {
      return res.status(404).json({
        success: false,
        error: 'Bill of Quantity not found'
      });
    }

    // User can only edit own draft, Supervisor/Admin can edit any
    if (req.user.role === 'user') {
      if (String(bill.createdBy) !== String(req.user.id)) {
        return res.status(401).json({ success: false, error: 'Not authorized to update this bill' });
      }
      if (!['draft', 'rejected'].includes(bill.status)) {
        return res.status(400).json({ success: false, error: 'User can only edit draft or rejected bills' });
      }
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

    if (!bill || String(bill.company) !== String(req.user.company)) {
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

// @desc    Submit bill of quantity for approval
// @route   POST /api/bills/:id/submit
// @access  Private (User+)
exports.submitBill = async (req, res, next) => {
  try {
    const bill = await BillOfQuantity.findById(req.params.id);
    if (!bill || String(bill.company) !== String(req.user.company)) {
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }
    // Only owner or elevated roles can submit
    if (String(bill.createdBy) !== String(req.user._id) && req.user.role === 'user') {
      return res.status(403).json({ success: false, error: 'Not authorized to submit this bill' });
    }
    if (!['draft', 'rejected'].includes(bill.status)) {
      return res.status(400).json({ success: false, error: 'Only draft or rejected bills can be submitted' });
    }
    bill.status = 'pending';
    await bill.save();
    res.status(200).json({ success: true, data: bill });
  } catch (err) {
    next(err);
  }
};

// @desc    Approve bill of quantity
// @route   POST /api/bills/:id/approve
// @access  Private (Supervisor/Admin)
exports.approveBill = async (req, res, next) => {
  try {
    const bill = await BillOfQuantity.findById(req.params.id);
    if (!bill || String(bill.company) !== String(req.user.company)) {
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }
    if (!['supervisor', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    if (bill.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Only pending bills can be approved' });
    }

    bill.status = 'approved';
    await bill.save();

    const approval = await Approval.create({
      company: req.user.company,
      boq: bill._id,
      supervisor: req.user._id,
      decision: 'APPROVED',
      comment: req.body.comment || ''
    });

    res.status(200).json({ success: true, data: { bill, approval } });
  } catch (err) {
    next(err);
  }
};

// @desc    Reject bill of quantity
// @route   POST /api/bills/:id/reject
// @access  Private (Supervisor/Admin)
exports.rejectBill = async (req, res, next) => {
  try {
    const bill = await BillOfQuantity.findById(req.params.id);
    if (!bill || String(bill.company) !== String(req.user.company)) {
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }
    if (!['supervisor', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    if (bill.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Only pending bills can be rejected' });
    }

    bill.status = 'rejected';
    await bill.save();

    const approval = await Approval.create({
      company: req.user.company,
      boq: bill._id,
      supervisor: req.user._id,
      decision: 'REJECTED',
      comment: req.body.comment || ''
    });

    res.status(200).json({ success: true, data: { bill, approval } });
  } catch (err) {
    next(err);
  }
};

// @desc    Publish approved bill of quantity
// @route   POST /api/bills/:id/publish
// @access  Private (User+ after approval)
exports.publishBill = async (req, res, next) => {
  try {
    const bill = await BillOfQuantity.findById(req.params.id);
    if (!bill || String(bill.company) !== String(req.user.company)) {
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }
    if (bill.status !== 'approved') {
      return res.status(400).json({ success: false, error: 'Only approved bills can be published' });
    }
    bill.status = 'published';
    await bill.save();
    res.status(200).json({ success: true, data: bill });
  } catch (err) {
    next(err);
  }
};

// @desc    Supervisor approval queue (pending bills in company)
// @route   GET /api/approvals/queue
// @access  Private (Supervisor or Admin)
exports.getApprovalQueue = async (req, res, next) => {
  try {
    if (!['supervisor', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    const pending = await BillOfQuantity.find({ company: req.user.company, status: 'pending' })
      .populate('event', 'eventName eventDate')
      .populate('customer', 'companyName email')
      .populate('createdBy', 'username');
    res.status(200).json({ success: true, count: pending.length, data: pending });
  } catch (err) {
    next(err);
  }
};
