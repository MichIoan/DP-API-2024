const BaseController = require('./BaseController');
const { Subtitles } = require("../models");

/**
 * Controller for handling subtitles-related operations
 * Extends BaseController to inherit common functionality
 */
class SubtitlesController extends BaseController {
    /**
     * Create new subtitles
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async createSubtitles(req, res) {
        const subtitles = req.body;

        const validation = this.validateRequiredFields(req.body, ['media_id']);
        if (!validation.isValid) {
            return this.handleError(req, res, 400, "Please provide a media_id for the subtitles.");
        }

        try {
            const newSubtitles = await Subtitles.create({
                media_id: subtitles.media_id,
                language: subtitles.language || 'en',
                file_path: subtitles.file_path || null
            });

            return this.handleSuccess(req, res, 201, {
                message: "Subtitles created successfully.",
                subtitles: newSubtitles,
            });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }

    /**
     * Delete subtitles by ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async deleteSubtitles(req, res) {
        const { subtitleId } = req.params;

        try {
            const subtitles = await Subtitles.findByPk(subtitleId);
            
            if (!subtitles) {
                return this.handleError(req, res, 404, "Subtitles not found.");
            }

            await subtitles.destroy();

            return this.handleSuccess(req, res, 200, {
                message: "Subtitles deleted successfully.",
            });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }

    /**
     * Get subtitles by media ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getSubtitlesByMediaId(req, res) {
        const { mediaId } = req.params;

        try {
            const subtitles = await Subtitles.findAll({
                where: { media_id: mediaId },
            });

            if (subtitles.length === 0) {
                return this.handleError(req, res, 404, "No subtitles found for this media.");
            }

            return this.handleSuccess(req, res, 200, { subtitles });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }

    /**
     * Get subtitles by ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getSubtitlesById(req, res) {
        const { subtitleId } = req.params;

        try {
            const subtitles = await Subtitles.findByPk(subtitleId);

            if (!subtitles) {
                return this.handleError(req, res, 404, "Subtitles not found.");
            }

            return this.handleSuccess(req, res, 200, { subtitles });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }

    /**
     * Update subtitles by ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async updateSubtitles(req, res) {
        const { subtitleId } = req.params;
        const subtitlesData = req.body;

        try {
            const subtitles = await Subtitles.findByPk(subtitleId);

            if (!subtitles) {
                return this.handleError(req, res, 404, "Subtitles not found.");
            }

            await subtitles.update(subtitlesData);

            return this.handleSuccess(req, res, 200, {
                message: "Subtitles updated successfully.",
                subtitles,
            });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }

    /**
     * Get all subtitles
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getAllSubtitles(req, res) {
        try {
            const subtitles = await Subtitles.findAll();

            return this.handleSuccess(req, res, 200, { subtitles });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }
}

// Create a singleton instance
const subtitlesController = new SubtitlesController();

// Export the instance
module.exports = subtitlesController;
