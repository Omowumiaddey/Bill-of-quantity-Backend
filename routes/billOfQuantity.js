const express = require('express');
const {
  getBills,
  getBill,
  createBill,
  updateBill,
  deleteBill
} = require('../controllers/billOfQuantity');

const router = express.Router();

const { protect } = require('../middleware/auth');

router
  .route('/')
  .get(protect, getBills)
  .post(protect, createBill);

router
  .route('/:id')
  .get(protect, getBill)
  .put(protect, updateBill)
  .delete(protect, deleteBill);

module.exports = router;