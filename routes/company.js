const express = require('express');
const {
  registerCompany,
  verifyCompanyOTP,
  getCompany
} = require('../controllers/company');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.post('/register', registerCompany);
router.post('/verify-otp', verifyCompanyOTP);
router.get('/:id', protect, getCompany);

module.exports = router;

/**
 * @swagger
 * components:
 *   schemas:
 *     Company:
 *       type: object
 *       required:
 *         - companyName
 *         - companyEmail
 *         - companyNumber
 *         - companyLocation
 *       properties:
 *         companyName:
 *           type: string
 *           example: "ABC Catering Services"
 *         companyEmail:
 *           type: string
 *           format: email
 *           example: "info@abccatering.com"
 *         companyNumber:
 *           type: string
 *           example: "+1-555-123-4567"
 *         companyLocation:
 *           type: string
 *           example: "New York, NY"
 *         adminPassword:
 *           type: string
 *           example: "admin123"
 *         userPassword:
 *           type: string
 *           example: "user123"
 *         supervisorPassword:
 *           type: string
 *           example: "supervisor123"
 */

/**
 * @swagger
 * tags:
 *   name: Company
 *   description: Company management
 */

/**
 * @swagger
 * /api/company/register:
 *   post:
 *     summary: Register new company
 *     tags: [Company]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Company'
 *     responses:
 *       201:
 *         description: Company registered successfully
 */

/**
 * @swagger
 * /api/company/{id}:
 *   get:
 *     summary: Get company details
 *     tags: [Company]
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
 *         description: Company details
 */
