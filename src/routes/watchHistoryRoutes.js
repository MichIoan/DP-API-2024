const express = require("express");
const router = express.Router();
const watchHistoryController = require("../controllers/watchHistoryController");
const isLoggedIn = require("../middleware/isLoggedIn");

/**
 * @swagger
 * tags:
 *   name: WatchHistory
 *   description: Watch history management
 */
router.use(isLoggedIn);

/**
 * @swagger
 * /history/profile/{profileId}:
 *   get:
 *     summary: Get watch history for a profile
 *     tags: [WatchHistory]
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
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [recent, oldest]
 *           default: recent
 *         description: Sort order
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
 *       404:
 *         description: Profile not found
 */
// Get watch history for a profile
router.get("/profile/:profileId", watchHistoryController.getHistory);

/**
 * @swagger
 * /history:
 *   post:
 *     summary: Mark media as watched
 *     tags: [WatchHistory]
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
 *               watchedDuration:
 *                 type: integer
 *                 description: Duration watched in seconds
 *               watchedPercentage:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Percentage of content watched
 *     responses:
 *       201:
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
 *                 historyEntry:
 *                   $ref: '#/components/schemas/WatchHistory'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Profile doesn't belong to user
 *       404:
 *         description: Profile or media not found
 */
// Mark media as watched
router.post("/", watchHistoryController.markAsWatched);

/**
 * @swagger
 * /history/{historyId}:
 *   patch:
 *     summary: Update watch history item
 *     tags: [WatchHistory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: historyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: History item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               watchedDuration:
 *                 type: integer
 *                 description: Duration watched in seconds
 *               watchedPercentage:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Percentage of content watched
 *               completed:
 *                 type: boolean
 *                 description: Whether the content was fully watched
 *     responses:
 *       200:
 *         description: Watch history item updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 historyEntry:
 *                   $ref: '#/components/schemas/WatchHistory'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - History item doesn't belong to user
 *       404:
 *         description: History item not found
 */
// Update watch history item
router.patch("/:historyId", watchHistoryController.updateHistory);

/**
 * @swagger
 * /history/{historyId}:
 *   delete:
 *     summary: Delete watch history item
 *     tags: [WatchHistory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: historyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: History item ID
 *     responses:
 *       200:
 *         description: History item deleted
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
 *                   example: History item deleted
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - History item doesn't belong to user
 *       404:
 *         description: History item not found
 */
// Delete watch history item
router.delete("/:historyId", watchHistoryController.deleteHistory);

module.exports = router;
