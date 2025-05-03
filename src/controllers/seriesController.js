const BaseController = require('./BaseController');
const { seriesService } = require('../services');

/**
 * Controller for handling series-related operations
 * Extends BaseController to inherit common functionality
 */
class SeriesController extends BaseController {
    /**
     * Create a new series
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async createSeries(req, res) {
        const seriesData = req.body;

        const validation = this.validateRequiredFields(req.body, ['title']);
        if (!validation.isValid) {
            return this.handleError(req, res, 400, "Please provide at least a title for the series.");
        }

        try {
            const newSeries = await seriesService.createSeries(seriesData);

            return this.handleSuccess(req, res, 201, {
                message: "Series created successfully.",
                series: newSeries,
            });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }

    /**
     * Get all series with optional filtering
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getAllSeries(req, res) {
        try {
            // Convert query parameters to appropriate types
            const options = this.convertParams(req.query, {
                page: 'number',
                limit: 'number',
                genre: 'string',
                classification: 'string'
            });
            
            const result = await seriesService.getAllSeries(options);
            
            return this.handleSuccess(req, res, 200, result);
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }

    /**
     * Get a series by ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getSeriesById(req, res) {
        const { seriesId } = req.params;

        if (!seriesId) {
            return this.handleError(req, res, 400, "Please provide a seriesId to retrieve.");
        }

        try {
            const series = await seriesService.getSeriesById(seriesId);

            if (!series) {
                return this.handleError(req, res, 404, "Series not found.");
            }

            return this.handleSuccess(req, res, 200, { series });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }

    /**
     * Update a series
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async updateSeries(req, res) {
        const { seriesId } = req.params;
        const seriesData = req.body;

        if (!seriesId) {
            return this.handleError(req, res, 400, "Please provide a seriesId to update.");
        }

        try {
            const updatedSeries = await seriesService.updateSeries(seriesId, seriesData);

            if (!updatedSeries) {
                return this.handleError(req, res, 404, "Series not found.");
            }

            return this.handleSuccess(req, res, 200, {
                message: "Series updated successfully.",
                series: updatedSeries
            });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }

    /**
     * Delete a series
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async deleteSeries(req, res) {
        const { seriesId } = req.params;

        if (!seriesId) {
            return this.handleError(req, res, 400, "Please provide a seriesId to delete.");
        }

        try {
            const result = await seriesService.deleteSeries(seriesId);

            if (!result) {
                return this.handleError(req, res, 404, "Series not found.");
            }

            return this.handleSuccess(req, res, 200, {
                message: "Series deleted successfully."
            });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }

    /**
     * Get all seasons for a series
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getSeasons(req, res) {
        const { seriesId } = req.params;

        if (!seriesId) {
            return this.handleError(req, res, 400, "Please provide a seriesId to retrieve seasons.");
        }

        try {
            const seasons = await seriesService.getSeasons(seriesId);

            return this.handleSuccess(req, res, 200, { seasons });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }

    /**
     * Create a season for a series
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async createSeason(req, res) {
        const { seriesId } = req.params;
        const seasonData = req.body;

        const validation = this.validateRequiredFields(req.body, ['season_number', 'title']);
        if (!validation.isValid) {
            return this.handleError(req, res, 400, "Please provide at least a season number and title for the season.");
        }

        try {
            const newSeason = await seriesService.createSeason(seriesId, seasonData);

            if (!newSeason) {
                return this.handleError(req, res, 404, "Series not found.");
            }

            return this.handleSuccess(req, res, 201, {
                message: "Season created successfully.",
                season: newSeason
            });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }

    /**
     * Get a season by ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getSeasonById(req, res) {
        const { seasonId } = req.params;

        if (!seasonId) {
            return this.handleError(req, res, 400, "Please provide a seasonId to retrieve.");
        }

        try {
            const season = await seriesService.getSeasonById(seasonId);

            if (!season) {
                return this.handleError(req, res, 404, "Season not found.");
            }

            return this.handleSuccess(req, res, 200, { season });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }

    /**
     * Update a season
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async updateSeason(req, res) {
        const { seasonId } = req.params;
        const seasonData = req.body;

        if (!seasonId) {
            return this.handleError(req, res, 400, "Please provide a seasonId to update.");
        }

        try {
            const updatedSeason = await seriesService.updateSeason(seasonId, seasonData);

            if (!updatedSeason) {
                return this.handleError(req, res, 404, "Season not found.");
            }

            return this.handleSuccess(req, res, 200, {
                message: "Season updated successfully.",
                season: updatedSeason
            });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }

    /**
     * Delete a season
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async deleteSeason(req, res) {
        const { seasonId } = req.params;

        if (!seasonId) {
            return this.handleError(req, res, 400, "Please provide a seasonId to delete.");
        }

        try {
            const result = await seriesService.deleteSeason(seasonId);

            if (!result) {
                return this.handleError(req, res, 404, "Season not found.");
            }

            return this.handleSuccess(req, res, 200, {
                message: "Season deleted successfully."
            });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }

    /**
     * Get all episodes for a season
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getEpisodes(req, res) {
        const { seasonId } = req.params;

        if (!seasonId) {
            return this.handleError(req, res, 400, "Please provide a seasonId to retrieve episodes.");
        }

        try {
            const episodes = await seriesService.getEpisodes(seasonId);

            return this.handleSuccess(req, res, 200, { episodes });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }

    /**
     * Create an episode for a season
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async createEpisode(req, res) {
        const { seasonId } = req.params;
        const episodeData = req.body;

        const validation = this.validateRequiredFields(req.body, ['episode_number', 'title', 'duration']);
        if (!validation.isValid) {
            return this.handleError(req, res, 400, "Please provide at least an episode number, title, and duration for the episode.");
        }

        try {
            const newEpisode = await seriesService.createEpisode(seasonId, episodeData);

            if (!newEpisode) {
                return this.handleError(req, res, 404, "Season not found.");
            }

            return this.handleSuccess(req, res, 201, {
                message: "Episode created successfully.",
                episode: newEpisode
            });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }

    /**
     * Get an episode by ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getEpisodeById(req, res) {
        const { episodeId } = req.params;

        if (!episodeId) {
            return this.handleError(req, res, 400, "Please provide an episodeId to retrieve.");
        }

        try {
            const episode = await seriesService.getEpisodeById(episodeId);

            if (!episode) {
                return this.handleError(req, res, 404, "Episode not found.");
            }

            return this.handleSuccess(req, res, 200, { episode });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }

    /**
     * Update an episode
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async updateEpisode(req, res) {
        const { episodeId } = req.params;
        const episodeData = req.body;

        if (!episodeId) {
            return this.handleError(req, res, 400, "Please provide an episodeId to update.");
        }

        try {
            const updatedEpisode = await seriesService.updateEpisode(episodeId, episodeData);

            if (!updatedEpisode) {
                return this.handleError(req, res, 404, "Episode not found.");
            }

            return this.handleSuccess(req, res, 200, {
                message: "Episode updated successfully.",
                episode: updatedEpisode
            });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }

    /**
     * Delete an episode
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async deleteEpisode(req, res) {
        const { episodeId } = req.params;

        if (!episodeId) {
            return this.handleError(req, res, 400, "Please provide an episodeId to delete.");
        }

        try {
            const result = await seriesService.deleteEpisode(episodeId);

            if (!result) {
                return this.handleError(req, res, 404, "Episode not found.");
            }

            return this.handleSuccess(req, res, 200, {
                message: "Episode deleted successfully."
            });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }

    /**
     * Start watching an episode
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async startWatchingEpisode(req, res) {
        const { profileId, episodeId } = req.body;

        const validation = this.validateRequiredFields(req.body, ['profileId', 'episodeId']);
        if (!validation.isValid) {
            return this.handleError(req, res, 400, "Profile ID and Episode ID are required.");
        }

        try {
            const watchSession = await seriesService.startWatchingEpisode(profileId, episodeId);

            return this.handleSuccess(req, res, 200, {
                message: "Started watching episode.",
                watchSession
            });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }

    /**
     * End watching an episode
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async endWatchingEpisode(req, res) {
        const { profileId, episodeId, watchedDuration, completed } = req.body;

        const validation = this.validateRequiredFields(req.body, ['profileId', 'episodeId', 'watchedDuration']);
        if (!validation.isValid) {
            return this.handleError(req, res, 400, "Profile ID, Episode ID, and watched duration are required.");
        }

        try {
            const watchHistory = await seriesService.endWatchingEpisode(
                profileId, 
                episodeId, 
                watchedDuration, 
                completed || false
            );

            return this.handleSuccess(req, res, 200, {
                message: "Ended watching episode.",
                watchHistory
            });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }
}

// Create a singleton instance
const seriesController = new SeriesController();

// Export the instance
module.exports = seriesController;
