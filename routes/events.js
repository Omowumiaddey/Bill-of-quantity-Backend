const express = require('express');
const {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent
} = require('../controllers/events');

const router = express.Router();
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       required:
 *         - eventName
 *         - eventDate
 *         - customer
 *       properties:
 *         eventName:
 *           type: string
 *           example: "Smith Wedding Reception"
 *         eventDate:
 *           type: string
 *           format: date
 *           example: "2024-06-15"
 *         eventTime:
 *           type: string
 *           example: "18:00"
 *         location:
 *           type: string
 *           example: "Grand Ballroom, Hotel Plaza"
 *         guestCount:
 *           type: number
 *           example: 150
 *         customer:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *     EventUpdate:
 *       type: object
 *       description: Fields to update on an event (all optional)
 *       properties:
 *         eventName:
 *           type: string
 *         eventDate:
 *           type: string
 *           format: date
 *         eventTime:
 *           type: string
 *         location:
 *           type: string
 *         guestCount:
 *           type: number
 *         customer:
 *           type: string
 */

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event management
 */

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *   post:
 *     summary: Create new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       201:
 *         description: Event created successfully
 */

router.use(protect);

router.route('/')
  .get(getEvents)
  .post(createEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Events]
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
 *         description: Event details
 *       404:
 *         description: Event not found
 */

router.route('/:id')
  .get(getEvent)
  .put(updateEvent)
  .delete(deleteEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Update event
 *     tags: [Events]
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
 *             $ref: '#/components/schemas/EventUpdate'
 *     responses:
 *       200:
 *         description: Event updated successfully
 *   delete:
 *     summary: Delete event
 *     tags: [Events]
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
 *         description: Event deleted successfully
 */

module.exports = router;

