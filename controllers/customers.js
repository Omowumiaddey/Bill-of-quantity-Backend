const Customer = require('../models/Customer');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
exports.getCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.find({ company: req.user.company });
    res.status(200).json({ 
      success: true, 
      count: customers.length,
      data: customers 
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
exports.getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, company: req.user.company });
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private
exports.createCustomer = async (req, res, next) => {
  try {
    const {
      companyName,
      contactPerson,
      address,
      email,
      twitter,
      instagram,
      facebook,
      discord,
      linkedin,
      cateringType,
      mobile,
      dateJoined
    } = req.body;

    const fieldErrors = {
      companyName: companyName ? undefined : 'Company name is required',
      contactPerson: contactPerson ? undefined : 'Contact person is required',
      mobile: mobile ? undefined : 'Mobile number is required'
    };

    if (Object.values(fieldErrors).some(Boolean)) {
      return res.status(400).json({
        success: false,
        fieldErrors,
        fields: {
          companyName,
          contactPerson,
          address,
          email,
          twitter,
          instagram,
          facebook,
          discord,
          linkedin,
          cateringType,
          mobile,
          dateJoined
        }
      });
    }

    const payload = {
      companyName,
      contactPerson,
      address,
      email,
      twitter,
      instagram,
      facebook,
      discord,
      linkedin,
      cateringType,
      mobile,
      dateJoined,
      createdBy: req.user.id,
      company: req.user.company
    };

    const customer = await Customer.create(payload);
    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
exports.updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company },
      req.body,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private (Admin only)
exports.deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, company: req.user.company });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    await customer.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

