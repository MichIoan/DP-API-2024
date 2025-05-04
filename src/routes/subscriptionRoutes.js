const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscriptionController");
const isLoggedIn = require("../middleware/isLoggedIn");

/**
 * @swagger
 * tags:
 *   name: Subscriptions
 *   description: Subscription management
 */

// Apply authentication middleware to all routes
router.use(isLoggedIn);

/**
 * @swagger
 * /subscriptions/all:
 *   get:
 *     summary: Get all subscriptions (admin only)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all subscriptions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 subscriptions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Subscription'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: No subscriptions found
 */
router.get("/all", subscriptionController.getAllSubscriptions);

/**
 * @swagger
 * /subscriptions:
 *   get:
 *     summary: Get current user's subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's subscription details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 subscription:
 *                   $ref: '#/components/schemas/Subscription'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: No subscription found
 */
router.get("/", subscriptionController.getUserSubscription);

/**
 * @swagger
 * /subscriptions:
 *   post:
 *     summary: Create a new subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subscriptionType
 *             properties:
 *               subscriptionType:
 *                 type: string
 *                 enum: [SD, HD, UHD]
 *     responses:
 *       201:
 *         description: Subscription created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Subscription updated successfully
 *                 type:
 *                   type: string
 *                   example: HD
 *                 price:
 *                   type: number
 *                   example: 12.99
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post("/", subscriptionController.createSubscription);

/**
 * @swagger
 * /subscriptions:
 *   put:
 *     summary: Update current user's subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subscriptionType
 *             properties:
 *               subscriptionType:
 *                 type: string
 *                 enum: [SD, HD, UHD]
 *     responses:
 *       200:
 *         description: Subscription updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Subscription updated successfully
 *                 type:
 *                   type: string
 *                   example: UHD
 *                 price:
 *                   type: number
 *                   example: 15.99
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put("/", subscriptionController.updateSubscription);

/**
 * @swagger
 * /subscriptions:
 *   delete:
 *     summary: Cancel current user's subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription canceled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Subscription canceled successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: No active subscription found
 */
router.delete("/", subscriptionController.cancelSubscription);

/**
 * @swagger
 * /subscriptions/recommendations/{profileId}:
 *   get:
 *     summary: Get recommended content for a profile
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Profile ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of recommendations
 *     responses:
 *       200:
 *         description: Recommended content
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Media'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/recommendations/:profileId", subscriptionController.getRecommendedContent);

module.exports = router;
