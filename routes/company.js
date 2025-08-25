const express = require('express');
const {
  registerCompany,
  verifyCompanyOTP,
  getCompany
} = require('../controllers/company');

const router = express.Router();

const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Accept both JSON and multipart/form-data (optional companyLogo file)
router.post('/register', upload.single('companyLogo'), registerCompany);
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
 *         - companyAddress
 *         - companyContactNumber
 *         - adminPassword
 *       properties:
 *         companyName:
 *           type: string
 *           example: "ABC Catering Services"
 *         companyEmail:
 *           type: string
 *           format: email
 *           example: "info@abccatering.com"
 *         adminEmail:
 *           type: string
 *           format: email
 *           description: Optional admin email for the primary admin user. Defaults to companyEmail if omitted.
 *           example: "admin@abccatering.com"
 *         companyAddress:
 *           type: string
 *           example: "123 Main Street, New York, NY 10001"
 *         companyContactNumber:
 *           type: string
 *           example: "+1-555-123-4567"
 *         adminPassword:
 *           type: string
 *           example: "admin123"
 *         companyLogo:
 *           type: string
 *           example: "https://example.com/logo.png"
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               companyName:
 *                 type: string
 *               companyEmail:
 *                 type: string
 *                 format: email
 *               adminEmail:
 *                 type: string
 *                 format: email
 *                 description: Optional; if not supplied, companyEmail will be used for the admin user
 *               companyAddress:
 *                 type: string
 *               companyContactNumber:
 *                 type: string
 *               adminPassword:
 *                 type: string
 *               companyLogo:
 *                 type: string
 *                 format: binary
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




