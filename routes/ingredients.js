const express = require('express');
const {
  getIngredients,
  getIngredient,
  createIngredient,
  updateIngredient,
  deleteIngredient
} = require('../controllers/ingredients');

const router = express.Router();
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getIngredients)
  .post(createIngredient);

router.route('/:id')
  .get(getIngredient)
  .put(updateIngredient)
  .delete(deleteIngredient);

/**
 * @swagger
 * components:
 *   schemas:
 *     Ingredient:
 *       type: object
 *       required:
 *         - name
 *         - unit
 *         - unitPrice
 *       properties:
 *         name:
 *           type: string
 *           example: "Organic Chicken Breast"
 *         unit:
 *           type: string
 *           example: "kg"
 *         unitPrice:
 *           type: number
 *           example: 12.99
 *         supplier:
 *           type: string
 *           example: "Fresh Farm Foods"
 *         category:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *     IngredientUpdate:
 *       type: object
 *       description: Fields to update on an ingredient (all optional)
 *       properties:
 *         name:
 *           type: string
 *         unit:
 *           type: string
 *         unitPrice:
 *           type: number
 *         currentStock:
 *           type: number
 *         minimumStock:
 *           type: number
 *         category:
 *           type: string
 */

/**
 * @swagger
 * tags:
 *   name: Ingredients
 *   description: Ingredient management
 */

/**
 * @swagger
 * /api/ingredients:
 *   get:
 *     summary: Get all ingredients
 *     tags: [Ingredients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of ingredients
 *   post:
 *     summary: Create new ingredient
 *     tags: [Ingredients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Ingredient'
 *     responses:
 *       201:
 *         description: Ingredient created successfully
 */

/**
 * @swagger
 * /api/ingredients/{id}:
 *   get:
 *     summary: Get ingredient by ID
 *     tags: [Ingredients]
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
 *         description: Ingredient details
 *       404:
 *         description: Ingredient not found
 *   put:
 *     summary: Update ingredient
 *     tags: [Ingredients]
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
 *             $ref: '#/components/schemas/IngredientUpdate'
 *     responses:
 *       200:
 *         description: Ingredient updated successfully
 *   delete:
 *     summary: Delete ingredient
 *     tags: [Ingredients]
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
 *         description: Ingredient deleted successfully
 */

module.exports = router;


