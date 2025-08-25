const express = require('express');
const {
  getBills,
  getBill,
  createBill,
  updateBill,
  deleteBill,
  submitBill,
  approveBill,
  rejectBill,
  publishBill,
  getApprovalQueue
} = require('../controllers/billOfQuantity');

const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     MenuItem:
 *       type: object
 *       required:
 *         - menu
 *         - quantity
 *         - unitPrice
 *       properties:
 *         menu:
 *           type: string
 *           description: Menu item ID
 *         quantity:
 *           type: number
 *           example: 10
 *         unitPrice:
 *           type: number
 *           example: 25.5
 *         totalPrice:
 *           type: number
 *           readOnly: true
 *     BillOfQuantity:
 *       type: object
 *       required:
 *         - title
 *         - event
 *         - customer
 *       properties:
 *         title:
 *           type: string
 *           example: "Wedding Reception BOQ"
 *         description:
 *           type: string
 *           example: "Detailed bill for the wedding reception"
 *         event:
 *           type: string
 *           description: Event ID
 *         customer:
 *           type: string
 *           description: Customer ID
 *         menuItems:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MenuItem'
 *         totalAmount:
 *           type: number
 *           readOnly: true
 *         status:
 *           type: string
 *           enum: [draft, pending, approved, rejected]
 */

/**
 * @swagger
 * tags:
 *   name: Bills
 *   description: Bill of Quantities management
 */

/**
 * @swagger
 * /api/bills:
 *   get:
 *     summary: Get all bills of quantities
 *     tags: [Bills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of bills
 *   post:
 *     summary: Create a new bill of quantity
 *     tags: [Bills]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BillOfQuantity'
 *     responses:
 *       201:
 *         description: Bill created successfully
 */

/**
 * @swagger
 * /api/bills/{id}:
 *   get:
 *     summary: Get bill of quantity by ID
 *     tags: [Bills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bill details
 *       404:
 *         description: Bill not found
 *   put:
 *     summary: Update bill of quantity
 *     tags: [Bills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BillOfQuantity'
 *     responses:
 *       200:
 *         description: Bill updated successfully
 *       404:
 *         description: Bill not found
 *   delete:
 *     summary: Delete bill of quantity
 *     tags: [Bills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bill deleted successfully
 *       404:
 *         description: Bill not found
 */

router
  .route('/')
  .get(protect, getBills)
  .post(protect, createBill);

router
  .route('/:id')
  .get(protect, getBill)
  .put(protect, updateBill)
  .delete(protect, deleteBill);

// BoQ workflow endpoints
router.post('/:id/submit', protect, submitBill);
router.post('/:id/approve', protect, authorize('admin', 'supervisor'), approveBill);
router.post('/:id/reject', protect, authorize('admin', 'supervisor'), rejectBill);
router.post('/:id/publish', protect, publishBill);

// Supervisor approval queue
router.get('/approvals/queue', protect, authorize('admin', 'supervisor'), getApprovalQueue);

module.exports = router;