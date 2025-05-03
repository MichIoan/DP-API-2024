const BaseController = require('./BaseController');
const { mediaService } = require('../services');

/**
 * Controller for handling movie-related operations
 * Extends BaseController to inherit common functionality
 */
class MovieController extends BaseController {
    /**
     * Create a new movie
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async createMovie(req, res) {
        const movie = req.body;

        const validation = this.validateRequiredFields(req.body, ['title', 'duration']);
        if (!validation.isValid) {
            return this.handleError(req, res, 400, "Please provide at least a title and a duration for the movie.");
        }

        try {
            const newMovie = await mediaService.createMovie(movie);

            return this.handleSuccess(req, res, 201, {
                message: "Movie added successfully.",
                movie: newMovie,
            });
        } catch (error) {
            console.error(error);
            if (error.name === 'SequelizeUniqueConstraintError') {
                return this.handleError(req, res, 409, "A movie with this title already exists.");
            }
            if (error.name === 'SequelizeValidationError') {
                return this.handleError(req, res, 422, "Invalid movie data provided.", error.message);
            }
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }

    /**
     * Delete a movie by ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async deleteMovie(req, res) {
        const { movieId } = req.params;

        if (!movieId) {
            return this.handleError(req, res, 400, "Please provide a movieId to delete.");
        }

        try {
            const result = await mediaService.deleteMovie(movieId);

            if (!result) {
                return this.handleError(req, res, 404, "Movie not found.");
            }

            return this.handleSuccess(req, res, 204, {
                message: "Movie deleted successfully."
            });
        } catch (error) {
            console.error(error);
            if (error.message && error.message.includes('foreign key constraint')) {
                return this.handleError(req, res, 409, "Cannot delete movie as it is referenced by other records.");
            }
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }

    /**
     * Get a movie by ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getMovieById(req, res) {
        const { movieId } = req.params;

        if (!movieId) {
            return this.handleError(req, res, 400, "Please provide a movieId to retrieve.");
        }

        try {
            const movie = await mediaService.getMovieById(movieId);

            if (!movie) {
                return this.handleError(req, res, 404, "Movie not found.");
            }

            return this.handleSuccess(req, res, 200, { movie });
        } catch (error) {
            console.error(error);
            if (error.name === 'SequelizeDatabaseError' && error.message.includes('invalid input syntax')) {
                return this.handleError(req, res, 400, "Invalid movie ID format.");
            }
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }

    /**
     * Get all movies with optional filtering
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getMovies(req, res) {
        try {
            // Convert query parameters to appropriate types
            const options = this.convertParams(req.query, {
                page: 'number',
                limit: 'number',
                genre: 'string',
                classification: 'string'
            });
            
            const result = await mediaService.getMovies(options);
            
            return this.handleSuccess(req, res, 200, result);
        } catch (error) {
            console.error(error);
            if (error.message && error.message.includes('invalid parameter')) {
                return this.handleError(req, res, 400, "Invalid query parameters.", error.message);
            }
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }

    /**
     * Update a movie by ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async updateMovie(req, res) {
        const { movieId } = req.params;
        const movieData = req.body;

        if (!movieId) {
            return this.handleError(req, res, 400, "Please provide a movieId to update.");
        }

        try {
            const updatedMovie = await mediaService.updateMovie(movieId, movieData);

            if (!updatedMovie) {
                return this.handleError(req, res, 404, "Movie not found.");
            }

            return this.handleSuccess(req, res, 200, {
                message: "Movie updated successfully.",
                movie: updatedMovie
            });
        } catch (error) {
            console.error(error);
            if (error.name === 'SequelizeUniqueConstraintError') {
                return this.handleError(req, res, 409, "A movie with this title already exists.");
            }
            if (error.name === 'SequelizeValidationError') {
                return this.handleError(req, res, 422, "Invalid movie data provided.", error.message);
            }
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }
}

const movieController = new MovieController();

module.exports = movieController;
