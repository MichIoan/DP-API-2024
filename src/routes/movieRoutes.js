const express = require("express");
const router = express.Router();
const movieController = require("../controllers/movieController");
const isLoggedIn = require("../middleware/isLoggedIn");

/**
 * @swagger
 * tags:
 *   name: Movies
 *   description: Movie management and access
 */

// Apply authentication middleware to all routes
router.use(isLoggedIn); 

/**
 * @swagger
 * /movies:
 *   get:
 *     summary: Get all movies
 *     tags: [Movies]
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
 *         description: List of movies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 movies:
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
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// Get all movies
router.get("/", movieController.getMovies);

/**
 * @swagger
 * /movies/{movieId}:
 *   get:
 *     summary: Get a specific movie by ID
 *     tags: [Movies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Movie ID
 *     responses:
 *       200:
 *         description: Movie details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 movie:
 *                   $ref: '#/components/schemas/Media'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Get a specific movie by ID
router.get("/:movieId", movieController.getMovieById);

/**
 * @swagger
 * /movies:
 *   post:
 *     summary: Create a new movie
 *     tags: [Movies]
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
 *               - duration
 *               - content_classification
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               release_date:
 *                 type: string
 *                 format: date
 *               duration:
 *                 type: integer
 *                 description: Duration in minutes
 *               content_classification:
 *                 type: string
 *                 enum: [G, PG, PG13, R, NC17]
 *               thumbnail_url:
 *                 type: string
 *                 format: uri
 *               media_url:
 *                 type: string
 *                 format: uri
 *               genres:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of genre IDs
 *     responses:
 *       201:
 *         description: Movie created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 movie:
 *                   $ref: '#/components/schemas/Media'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
// Create a new movie
router.post("/", movieController.createMovie);

/**
 * @swagger
 * /movies/{movieId}:
 *   put:
 *     summary: Update a movie
 *     tags: [Movies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Movie ID
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
 *               duration:
 *                 type: integer
 *                 description: Duration in minutes
 *               content_classification:
 *                 type: string
 *                 enum: [G, PG, PG13, R, NC17]
 *               thumbnail_url:
 *                 type: string
 *                 format: uri
 *               media_url:
 *                 type: string
 *                 format: uri
 *               genres:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of genre IDs
 *     responses:
 *       200:
 *         description: Movie updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 movie:
 *                   $ref: '#/components/schemas/Media'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Update a movie
router.put("/:movieId", movieController.updateMovie);

/**
 * @swagger
 * /movies/{movieId}:
 *   delete:
 *     summary: Delete a movie
 *     tags: [Movies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Movie ID
 *     responses:
 *       200:
 *         description: Movie deleted successfully
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
 *                   example: Movie deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Delete a movie
router.delete("/:movieId", movieController.deleteMovie);

module.exports = router;
