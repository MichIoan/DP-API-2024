const express = require("express");
const router = express.Router();
const mediaController = require("../controllers/mediaController");
const isLoggedIn = require("../middleware/isLoggedIn");

/**
 * @swagger
 * tags:
 *   name: Media
 *   description: Media management and access
 */

/**
 * @swagger
 * /media:
 *   get:
 *     summary: Get all media with optional filtering
 *     tags: [Media]
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
 *         name: genre
 *         schema:
 *           type: string
 *         description: Filter by genre name
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [movie, episode]
 *         description: Filter by media type
 *       - in: query
 *         name: classification
 *         schema:
 *           type: string
 *           enum: [G, PG, PG13, R, NC17]
 *         description: Filter by content classification
 *     responses:
 *       200:
 *         description: List of media items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 media:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Media'
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
 */
router.get("/", mediaController.getAllMedia);

/**
 * @swagger
 * /media/search:
 *   get:
 *     summary: Search for media by title, description, or genre
 *     tags: [Media]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Media'
 *                 count:
 *                   type: integer
 */
router.get("/search", mediaController.searchMedia);

/**
 * @swagger
 * /media/{mediaId}:
 *   get:
 *     summary: Get media by ID
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: mediaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Media ID
 *     responses:
 *       200:
 *         description: Media details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 media:
 *                   $ref: '#/components/schemas/Media'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get("/:mediaId", mediaController.getMediaById);

// Protected routes (authentication required)
router.use(isLoggedIn);

/**
 * @swagger
 * /media/watchlist:
 *   post:
 *     summary: Add media to watch list
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - profileId
 *               - mediaId
 *             properties:
 *               profileId:
 *                 type: integer
 *               mediaId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Added to watch list
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
 *                   example: Added to watch list
 *                 watchListEntry:
 *                   $ref: '#/components/schemas/WatchList'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Profile doesn't belong to user
 */
router.post("/watchlist", mediaController.addToWatchList);

/**
 * @swagger
 * /media/profile/{profileId}/watchlist:
 *   get:
 *     summary: Get watch list for a profile
 *     tags: [Media]
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
 *         description: Watch list items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 watchList:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WatchList'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Profile doesn't belong to user
 */
router.get("/profile/:profileId/watchlist", mediaController.getWatchList);

/**
 * @swagger
 * /media/history:
 *   post:
 *     summary: Mark media as watched
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - profileId
 *               - mediaId
 *             properties:
 *               profileId:
 *                 type: integer
 *               mediaId:
 *                 type: integer
 *               progress:
 *                 type: integer
 *                 default: 100
 *                 description: Viewing progress (0-100)
 *     responses:
 *       200:
 *         description: Marked as watched
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
 *                   example: Marked as watched
 *                 watchHistoryEntry:
 *                   $ref: '#/components/schemas/WatchHistory'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Profile doesn't belong to user
 */
router.post("/history", mediaController.markAsWatched);

/**
 * @swagger
 * /media/profile/{profileId}/history:
 *   get:
 *     summary: Get watch history for a profile
 *     tags: [Media]
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
 *         description: Watch history items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 history:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WatchHistory'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Profile doesn't belong to user
 */
router.get("/profile/:profileId/history", mediaController.getWatchHistory);

/**
 * @swagger
 * /media/profile/{profileId}/recommendations:
 *   get:
 *     summary: Get recommended content for a profile
 *     tags: [Media]
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
 *       403:
 *         description: Forbidden - Profile doesn't belong to user
 */
router.get("/profile/:profileId/recommendations", mediaController.getRecommendedContent);

module.exports = router;
