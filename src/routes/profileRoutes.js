const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const isLoggedIn = require("../middleware/isLoggedIn");

/**
 * @swagger
 * tags:
 *   name: Profiles
 *   description: User profile management
 */

router.use(isLoggedIn);

/**
 * @swagger
 * /profiles:
 *   get:
 *     summary: Get all profiles for the authenticated user
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user profiles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 profiles:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Profile'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: No profiles found
 */
router.get("/", profileController.getUserProfiles);

/**
 * @swagger
 * /profiles:
 *   post:
 *     summary: Create a new profile for the authenticated user
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               language:
 *                 type: string
 *                 default: en
 *               content_classification:
 *                 type: string
 *                 enum: [G, PG, PG13, R, NC17]
 *                 default: PG13
 *               is_kids:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Profile created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 profile:
 *                   $ref: '#/components/schemas/Profile'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post("/", profileController.createProfile);

/**
 * @swagger
 * /profiles/{profileId}:
 *   get:
 *     summary: Get a specific profile by ID
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Profile ID
 *     responses:
 *       200:
 *         description: Profile details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 profile:
 *                   $ref: '#/components/schemas/Profile'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Profile doesn't belong to user
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get("/:profileId", profileController.getProfileById);

/**
 * @swagger
 * /profiles/{profileId}:
 *   patch:
 *     summary: Update a profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Profile ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               language:
 *                 type: string
 *               content_classification:
 *                 type: string
 *                 enum: [G, PG, PG13, R, NC17]
 *               is_kids:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 profile:
 *                   $ref: '#/components/schemas/Profile'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Profile doesn't belong to user
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch("/:profileId", profileController.updateProfile);

/**
 * @swagger
 * /profiles/{profileId}:
 *   delete:
 *     summary: Delete a profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Profile ID
 *     responses:
 *       200:
 *         description: Profile deleted successfully
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
 *                   example: Profile deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Profile doesn't belong to user
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete("/:profileId", profileController.deleteProfile);

/**
 * @swagger
 * /profiles/{profileId}/content:
 *   get:
 *     summary: Get age-appropriate content for a profile
 *     tags: [Profiles]
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
 *           default: 20
 *         description: Maximum number of items
 *     responses:
 *       200:
 *         description: Age-appropriate content
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 content:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Media'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Profile doesn't belong to user
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get("/:profileId/content", profileController.getAgeAppropriateContent);

module.exports = router;
