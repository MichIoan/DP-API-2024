const express = require("express");
const isLoggedIn = require("../middleware/isLoggedIn");
const validate = require("../middleware/validate");
const { updateUserSchema, applyReferralSchema } = require("../validation/userValidation");
const router = express.Router();

// Import controllers
const userController = require("../controllers/userController");

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User account management
 */

// All user routes require authentication
router.use(isLoggedIn);

/**
 * @swagger
 * /user/account:
 *   get:
 *     summary: Get user account information
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User account information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_id:
 *                   type: integer
 *                 email:
 *                   type: string
 *                 first_name:
 *                   type: string
 *                 last_name:
 *                   type: string
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/account", userController.getUserAccount);

/**
 * @swagger
 * /user/account:
 *   put:
 *     summary: Update user account information
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Account updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Email already in use
 *       500:
 *         description: Server error
 */
router.put("/account", validate(updateUserSchema), userController.updateUserAccount);

/**
 * @swagger
 * /user/account:
 *   delete:
 *     summary: Delete user account
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete("/account", userController.deleteUserAccount);

/**
 * @swagger
 * /user/referrals:
 *   get:
 *     summary: Get users referred by current user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of referred users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   user_id:
 *                     type: integer
 *                   email:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/referrals", userController.getReferredUsers);

/**
 * @swagger
 * /user/referrals/apply:
 *   post:
 *     summary: Apply a referral code to user account
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - referral_code
 *             properties:
 *               referral_code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Referral code applied successfully
 *       400:
 *         description: Invalid referral code
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Referral code already applied
 *       500:
 *         description: Server error
 */
router.post("/referrals/apply", validate(applyReferralSchema), userController.applyReferralCode);

module.exports = router;