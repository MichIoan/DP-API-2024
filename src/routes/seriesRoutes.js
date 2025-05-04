const express = require("express");
const router = express.Router();
const seriesController = require("../controllers/seriesController");
const isLoggedIn = require("../middleware/isLoggedIn");

/**
 * @swagger
 * tags:
 *   name: Series
 *   description: TV series, seasons, and episodes management
 */

router.use(isLoggedIn);

/**
 * @swagger
 * /series:
 *   get:
 *     summary: Get all series
 *     tags: [Series]
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
 *         name: genre
 *         schema:
 *           type: string
 *         description: Filter by genre name
 *       - in: query
 *         name: classification
 *         schema:
 *           type: string
 *           enum: [G, PG, PG13, R, NC17]
 *         description: Filter by content classification
 *     responses:
 *       200:
 *         description: List of series
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 series:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Series'
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
// Get all series
router.get("/", seriesController.getAllSeries);

/**
 * @swagger
 * /series/{seriesId}:
 *   get:
 *     summary: Get a specific series by ID
 *     tags: [Series]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Series ID
 *     responses:
 *       200:
 *         description: Series details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 series:
 *                   $ref: '#/components/schemas/Series'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Get a specific series by ID
router.get("/:seriesId", seriesController.getSeriesById);

/**
 * @swagger
 * /series:
 *   post:
 *     summary: Create a new series
 *     tags: [Series]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - release_date
 *               - content_classification
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               release_date:
 *                 type: string
 *                 format: date
 *               content_classification:
 *                 type: string
 *                 enum: [G, PG, PG13, R, NC17]
 *               thumbnail_url:
 *                 type: string
 *                 format: uri
 *               genres:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of genre IDs
 *     responses:
 *       201:
 *         description: Series created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 series:
 *                   $ref: '#/components/schemas/Series'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// Create a new series
router.post("/", seriesController.createSeries);

/**
 * @swagger
 * /series/{seriesId}:
 *   put:
 *     summary: Update a series
 *     tags: [Series]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Series ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               release_date:
 *                 type: string
 *                 format: date
 *               content_classification:
 *                 type: string
 *                 enum: [G, PG, PG13, R, NC17]
 *               thumbnail_url:
 *                 type: string
 *                 format: uri
 *               genres:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of genre IDs
 *     responses:
 *       200:
 *         description: Series updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 series:
 *                   $ref: '#/components/schemas/Series'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Update a series
router.put("/:seriesId", seriesController.updateSeries);

/**
 * @swagger
 * /series/{seriesId}:
 *   delete:
 *     summary: Delete a series
 *     tags: [Series]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Series ID
 *     responses:
 *       200:
 *         description: Series deleted successfully
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
 *                   example: Series deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Delete a series
router.delete("/:seriesId", seriesController.deleteSeries);

/**
 * @swagger
 * /series/{seriesId}/seasons:
 *   get:
 *     summary: Get all seasons for a series
 *     tags: [Series]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Series ID
 *     responses:
 *       200:
 *         description: List of seasons
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 seasons:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Season'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Get all seasons for a series
router.get("/:seriesId/seasons", seriesController.getSeasons);

/**
 * @swagger
 * /series/{seriesId}/seasons/{seasonId}:
 *   get:
 *     summary: Get a specific season
 *     tags: [Series]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Series ID
 *       - in: path
 *         name: seasonId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Season ID
 *     responses:
 *       200:
 *         description: Season details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 season:
 *                   $ref: '#/components/schemas/Season'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Get a specific season
router.get("/:seriesId/seasons/:seasonId", seriesController.getSeasonById);

/**
 * @swagger
 * /series/{seriesId}/seasons:
 *   post:
 *     summary: Create a new season for a series
 *     tags: [Series]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Series ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - season_number
 *               - title
 *               - release_date
 *             properties:
 *               season_number:
 *                 type: integer
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               release_date:
 *                 type: string
 *                 format: date
 *               thumbnail_url:
 *                 type: string
 *                 format: uri
 *     responses:
 *       201:
 *         description: Season created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 season:
 *                   $ref: '#/components/schemas/Season'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Create a new season for a series
router.post("/:seriesId/seasons", seriesController.createSeason);

/**
 * @swagger
 * /series/{seriesId}/seasons/{seasonId}:
 *   put:
 *     summary: Update a season
 *     tags: [Series]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Series ID
 *       - in: path
 *         name: seasonId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Season ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               season_number:
 *                 type: integer
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               release_date:
 *                 type: string
 *                 format: date
 *               thumbnail_url:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Season updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 season:
 *                   $ref: '#/components/schemas/Season'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Update a season
router.put("/:seriesId/seasons/:seasonId", seriesController.updateSeason);

/**
 * @swagger
 * /series/{seriesId}/seasons/{seasonId}:
 *   delete:
 *     summary: Delete a season
 *     tags: [Series]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Series ID
 *       - in: path
 *         name: seasonId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Season ID
 *     responses:
 *       200:
 *         description: Season deleted successfully
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
 *                   example: Season deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Delete a season
router.delete("/:seriesId/seasons/:seasonId", seriesController.deleteSeason);

/**
 * @swagger
 * /series/{seriesId}/seasons/{seasonId}/episodes:
 *   get:
 *     summary: Get all episodes for a season
 *     tags: [Series]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Series ID
 *       - in: path
 *         name: seasonId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Season ID
 *     responses:
 *       200:
 *         description: List of episodes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 episodes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Episode'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Get all episodes for a season
router.get("/:seriesId/seasons/:seasonId/episodes", seriesController.getEpisodes);

/**
 * @swagger
 * /series/{seriesId}/seasons/{seasonId}/episodes/{episodeId}:
 *   get:
 *     summary: Get a specific episode
 *     tags: [Series]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Series ID
 *       - in: path
 *         name: seasonId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Season ID
 *       - in: path
 *         name: episodeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Episode ID
 *     responses:
 *       200:
 *         description: Episode details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 episode:
 *                   $ref: '#/components/schemas/Episode'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Get a specific episode
router.get("/:seriesId/seasons/:seasonId/episodes/:episodeId", seriesController.getEpisodeById);

/**
 * @swagger
 * /series/{seriesId}/seasons/{seasonId}/episodes:
 *   post:
 *     summary: Create a new episode for a season
 *     tags: [Series]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Series ID
 *       - in: path
 *         name: seasonId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Season ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - episode_number
 *               - title
 *               - duration
 *             properties:
 *               episode_number:
 *                 type: integer
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               duration:
 *                 type: integer
 *                 description: Duration in minutes
 *               thumbnail_url:
 *                 type: string
 *                 format: uri
 *               media_url:
 *                 type: string
 *                 format: uri
 *     responses:
 *       201:
 *         description: Episode created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 episode:
 *                   $ref: '#/components/schemas/Episode'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Create a new episode for a season
router.post("/:seriesId/seasons/:seasonId/episodes", seriesController.createEpisode);

/**
 * @swagger
 * /series/{seriesId}/seasons/{seasonId}/episodes/{episodeId}:
 *   put:
 *     summary: Update an episode
 *     tags: [Series]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Series ID
 *       - in: path
 *         name: seasonId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Season ID
 *       - in: path
 *         name: episodeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Episode ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               episode_number:
 *                 type: integer
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               duration:
 *                 type: integer
 *                 description: Duration in minutes
 *               thumbnail_url:
 *                 type: string
 *                 format: uri
 *               media_url:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Episode updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 episode:
 *                   $ref: '#/components/schemas/Episode'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Update an episode
router.put("/:seriesId/seasons/:seasonId/episodes/:episodeId", seriesController.updateEpisode);

/**
 * @swagger
 * /series/{seriesId}/seasons/{seasonId}/episodes/{episodeId}:
 *   delete:
 *     summary: Delete an episode
 *     tags: [Series]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Series ID
 *       - in: path
 *         name: seasonId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Season ID
 *       - in: path
 *         name: episodeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Episode ID
 *     responses:
 *       200:
 *         description: Episode deleted successfully
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
 *                   example: Episode deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Delete an episode
router.delete("/:seriesId/seasons/:seasonId/episodes/:episodeId", seriesController.deleteEpisode);

/**
 * @swagger
 * /series/watch/{seriesId}/seasons/{seasonId}/episodes/{episodeId}/start:
 *   post:
 *     summary: Start watching an episode
 *     tags: [Series]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Series ID
 *       - in: path
 *         name: seasonId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Season ID
 *       - in: path
 *         name: episodeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Episode ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - profileId
 *             properties:
 *               profileId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Started watching episode
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
 *                   example: Started watching episode
 *                 watchSession:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     profileId:
 *                       type: integer
 *                     episodeId:
 *                       type: integer
 *                     startTime:
 *                       type: string
 *                       format: date-time
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Start watching an episode
router.post("/watch/:seriesId/seasons/:seasonId/episodes/:episodeId/start", seriesController.startSeriesEpisode);

/**
 * @swagger
 * /series/watch/{seriesId}/seasons/{seasonId}/episodes/{episodeId}/end:
 *   post:
 *     summary: Finish watching an episode
 *     tags: [Series]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: seriesId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Series ID
 *       - in: path
 *         name: seasonId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Season ID
 *       - in: path
 *         name: episodeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Episode ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - profileId
 *               - watchedDuration
 *             properties:
 *               profileId:
 *                 type: integer
 *               watchedDuration:
 *                 type: integer
 *                 description: Duration watched in seconds
 *               completed:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Finished watching episode
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
 *                   example: Finished watching episode
 *                 watchHistory:
 *                   $ref: '#/components/schemas/WatchHistory'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Finish watching an episode
router.post("/watch/:seriesId/seasons/:seasonId/episodes/:episodeId/end", seriesController.endSeriesEpisode);

module.exports = router;
