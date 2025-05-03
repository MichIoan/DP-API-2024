const express = require("express");
const router = express.Router();
const watchListController = require("../controllers/watchListController");
const isLoggedIn = require("../middleware/isLoggedIn");

/**
 * @swagger
 * tags:
 *   name: WatchList
 *   description: Watch list management
 */

router.use(isLoggedIn);

/**
 * @swagger
 * /watchlist/profile/{profileId}:
 *   get:
 *     summary: Get watch list for a profile
 *     tags: [WatchList]
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
 *       404:
 *         description: Profile not found
 */
// Get watch list for a profile
router.get("/profile/:profileId", watchListController.getWatchList);

/**
 * @swagger
 * /watchlist:
 *   post:
 *     summary: Add item to watch list
 *     tags: [WatchList]
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
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Profile doesn't belong to user
 *       404:
 *         description: Profile or media not found
 */
// Add item to watch list
router.post("/", watchListController.addToWatchList);

/**
 * @swagger
 * /watchlist/{watchListId}:
 *   patch:
 *     summary: Update watch list item
 *     tags: [WatchList]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: watchListId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Watch list item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [added, removed, watched]
 *     responses:
 *       200:
 *         description: Watch list item updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 watchListEntry:
 *                   $ref: '#/components/schemas/WatchList'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Watch list item doesn't belong to user
 *       404:
 *         description: Watch list item not found
 */
// Update watch list item
router.patch("/:watchListId", watchListController.updateWatchList);

/**
 * @swagger
 * /watchlist/{watchListId}:
 *   delete:
 *     summary: Remove item from watch list
 *     tags: [WatchList]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: watchListId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Watch list item ID
 *     responses:
 *       200:
 *         description: Item removed from watch list
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
 *                   example: Item removed from watch list
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Watch list item doesn't belong to user
 *       404:
 *         description: Watch list item not found
 */
// Remove item from watch list
router.delete("/:watchListId", watchListController.removeFromWatchList);

module.exports = router;
