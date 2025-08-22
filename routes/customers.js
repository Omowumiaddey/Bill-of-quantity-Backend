const express = require('express');
const {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer
} = require('../controllers/customers');

const router = express.Router();
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Customer:
 *       type: object
 *       required:
 *         - companyName
 *         - contactPerson
 *         - mobile
 *       properties:
 *         companyName:
 *           type: string
 *           example: "Smith Wedding Services"
 *         contactPerson:
 *           type: string
 *           example: "John Smith"
 *         address:
 *           type: string
 *           example: "456 Oak Street, Boston, MA"
 *         email:
 *           type: string
 *           format: email
 *           example: "john@smithweddings.com"
 *         mobile:
 *           type: string
 *           example: "+1-555-987-6543"
 *         twitter:
 *           type: string
 *         instagram:
 *           type: string
 *         facebook:
 *           type: string
 *         discord:
 *           type: string
 *         linkedin:
 *           type: string
 *         cateringType:
 *           type: string
 *         dateJoined:
 *           type: string
 *           format: date
 */

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Customer management
 */

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Get all customers
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of customers
 *   post:
 *     summary: Create new customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Customer'
 *     responses:
 *       201:
 *         description: Customer created successfully
 */

router.use(protect);

router.route('/')
  .get(getCustomers)
  .post(createCustomer);

router.route('/:id')
  .get(getCustomer)
  .put(updateCustomer)
  .delete(deleteCustomer);

module.exports = router;




