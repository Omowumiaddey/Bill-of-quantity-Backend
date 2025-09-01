const express = require('express');
const {
  register,
  verifyUserOTP,
  login,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
  updatePreferences,
  // resend endpoint to support UI flows
  resendUserOTP
} = require('../controllers/auth');

const router = express.Router();
const { protect, ensureApiAuth } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterRequest:
 *       type: object
 *       properties:
 *         companyEmail:
 *           type: string
 *           format: email
 *           description: Registered company email
 *           example: corp@example.com
 *         desiredRole:
 *           type: string
 *           enum: [admin, supervisor, user]
 *           example: user
 *         personalEmail:
 *           type: string
 *           format: email
 *           example: person@example.com
 *         password:
 *           type: string
 *           example: StrongP@ssw0rd
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         username:
 *           type: string
 *     LoginRequest:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: john@example.com
 *         password:
 *           type: string
 *           example: StrongP@ssw0rd
 *         rememberMe:
 *           type: boolean
 *           example: true
 *     VerifyUserOtpRequest:
 *       type: object
 *       required: [pendingUserId, code]
 *       properties:
 *         pendingUserId:
 *           type: string
 *         code:
 *           type: string
 *           example: "123456"
 *     ForgotPasswordRequest:
 *       type: object
 *       required: [email]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         companyEmail:
 *           type: string
 *           format: email
 *           description: Optional company email to disambiguate
 *     ResetPasswordRequest:
 *       type: object
 *       required: [token, newPassword]
 *       properties:
 *         token:
 *           type: string
 *         newPassword:
 *           type: string
 *     PreferencesUpdate:
 *       type: object
 *       properties:
 *         forceLogoutOnClose:
 *           type: boolean
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Self-register a user (OTP sent to company email) or legacy direct register
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/RegisterRequest'
 *               - type: object
 *                 description: Legacy direct register
 *                 properties:
 *                   username: { type: string }
 *                   email: { type: string, format: email }
 *                   password: { type: string }
 *                   role: { type: string, enum: [admin, supervisor, user] }
 *                   company: { type: string }
 *     responses:
 *       201:
 *         description: Pending user created (needs OTP) or user registered
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify user registration OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyUserOtpRequest'
 *     responses:
 *       200:
 *         description: OTP verified successfully
 */
router.post('/verify-otp', verifyUserOTP);
/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: Resend a user registration OTP to the company email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [companyEmail, pendingUserId]
 *             properties:
 *               companyEmail: { type: string, format: email }
 *               pendingUserId: { type: string }
 *     responses:
 *       200:
 *         description: OTP resent if allowed by rate limits
 */
router.post('/resend-otp', resendUserOTP);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset link via email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: If the user exists, a reset email is sent
 */
router.post('/forgot-password', forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using a token from email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password updated
 */
router.post('/reset-password', resetPassword);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 */
router.get('/me', protect, getMe);

/**
 * @swagger
 * /api/auth/logout:
 *   get:
 *     summary: Logout user and clear refresh cookie
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.get('/logout', protect, logout);

/**
 * @swagger
 * /api/users/{id}/preferences:
 *   patch:
 *     summary: Update user preferences (e.g., force logout on close)
 *     tags: [Authentication]
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
 *             $ref: '#/components/schemas/PreferencesUpdate'
 *     responses:
 *       200:
 *         description: Preferences updated
 */
router.patch('/users/:id/preferences', protect, updatePreferences);

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verify token and get user ID (for frontend use)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid, returns user ID
 */
router.get('/verify', protect, (req, res) => {
  return res.status(200).json({
    success: true,
    userId: req.user ? req.user._id : null,
    user: req.user ? { id: req.user._id, email: req.user.email, role: req.user.role } : null
  });
});

module.exports = router;
