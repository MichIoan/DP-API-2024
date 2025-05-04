const express = require("express");
const router = express.Router();
const subtitlesController = require("../controllers/subtitlesController");
const isLoggedIn = require("../middleware/isLoggedIn");

/**
 * @swagger
 * tags:
 *   name: Subtitles
 *   description: Subtitles management
 */

router.use(isLoggedIn);

/**
 * @swagger
 * /subtitles:
 *   get:
 *     summary: Get all subtitles
 *     tags: [Subtitles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *         description: Filter by language
 *     responses:
 *       200:
 *         description: List of subtitles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 subtitles:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Subtitle'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// Get all subtitles
router.get("/", subtitlesController.getAllSubtitles);

/**
 * @swagger
 * /subtitles/{subtitleId}:
 *   get:
 *     summary: Get a specific subtitle by ID
 *     tags: [Subtitles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subtitleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subtitle ID
 *     responses:
 *       200:
 *         description: Subtitle details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 subtitle:
 *                   $ref: '#/components/schemas/Subtitle'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Get a specific subtitle by ID
router.get("/:subtitleId", subtitlesController.getSubtitlesById);

/**
 * @swagger
 * /subtitles:
 *   post:
 *     summary: Create a new subtitle
 *     tags: [Subtitles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mediaId
 *               - language
 *               - file_path
 *             properties:
 *               mediaId:
 *                 type: integer
 *               language:
 *                 type: string
 *               file_path:
 *                 type: string
 *     responses:
 *       201:
 *         description: Subtitle created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 subtitle:
 *                   $ref: '#/components/schemas/Subtitle'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// Create a new subtitle
router.post("/", subtitlesController.createSubtitles);

/**
 * @swagger
 * /subtitles/{subtitleId}:
 *   put:
 *     summary: Update a subtitle
 *     tags: [Subtitles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subtitleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subtitle ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               language:
 *                 type: string
 *               file_path:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subtitle updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 subtitle:
 *                   $ref: '#/components/schemas/Subtitle'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Update a subtitle
router.put("/:subtitleId", subtitlesController.updateSubtitles);

/**
 * @swagger
 * /subtitles/{subtitleId}:
 *   delete:
 *     summary: Delete a subtitle
 *     tags: [Subtitles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subtitleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subtitle ID
 *     responses:
 *       200:
 *         description: Subtitle deleted successfully
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
 *                   example: Subtitle deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Delete a subtitle
router.delete("/:subtitleId", subtitlesController.deleteSubtitles);

/**
 * @swagger
 * /subtitles/media/{mediaId}:
 *   get:
 *     summary: Get subtitles for a specific media
 *     tags: [Subtitles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mediaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Media ID
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *         description: Filter by language
 *     responses:
 *       200:
 *         description: List of subtitles for the media
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 subtitles:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Subtitle'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Get subtitles for a specific media
router.get("/media/:mediaId", subtitlesController.getSubtitlesByMediaId);

module.exports = router;
