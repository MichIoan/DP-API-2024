const BaseController = require('./BaseController');
const WatchHistory = require("../models/WatchHistory");

/**
 * Controller for handling watch history operations
 * Extends BaseController to inherit common functionality
 */
class WatchHistoryController extends BaseController {
    /**
     * Get watch history for a profile
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getHistory(req, res) {
        const { profileId } = req.params;

        const validation = this.validateRequiredFields({ profileId }, ['profileId']);
        if (!validation.isValid) {
            return this.handleError(req, res, 400, "Please provide a profileId to retrieve the watch history.");
        }

        try {
            const query = `
                SELECT * FROM "watch_history_details"
                WHERE profile_id = :profileId;
            `;
            
            const result = await WatchHistory.sequelize.query(query, {
                replacements: { profileId },
                type: WatchHistory.sequelize.QueryTypes.SELECT,
            });

            if (result.length === 0) {
                return this.handleError(req, res, 404, "No watch history found for the given profileId.");
            }

            return this.handleSuccess(req, res, 200, { history: result });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }

    /**
     * Update watch history item
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async updateHistory(req, res) {
        const { historyId } = req.params;
        const { watchedDuration, watchedPercentage, completed } = req.body;

        try {
            const historyItem = await WatchHistory.findByPk(historyId);

            if (!historyItem) {
                return this.handleError(req, res, 404, "Watch history item not found.");
            }

            // Update the history item with the provided data
            const updateData = {};
            if (watchedDuration !== undefined) updateData.watched_duration = watchedDuration;
            if (watchedPercentage !== undefined) updateData.watched_percentage = watchedPercentage;
            if (completed !== undefined) updateData.completed = completed;
            
            await historyItem.update(updateData);

            return this.handleSuccess(req, res, 200, {
                message: "Watch history updated successfully.",
                historyEntry: historyItem
            });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }

    /**
     * Mark media as watched
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async markAsWatched(req, res) {
        const { profileId, mediaId, watchedDuration, watchedPercentage } = req.body;

        const validation = this.validateRequiredFields(req.body, ['profileId', 'mediaId']);
        if (!validation.isValid) {
            return this.handleError(req, res, 400, "Profile ID and Media ID are required.");
        }

        try {
            // Check if entry already exists
            let historyEntry = await WatchHistory.findOne({
                where: {
                    profile_id: profileId,
                    media_id: mediaId
                }
            });

            if (historyEntry) {
                // Update existing entry
                const updateData = {
                    watched_date: new Date()
                };
                
                if (watchedDuration !== undefined) updateData.watched_duration = watchedDuration;
                if (watchedPercentage !== undefined) updateData.watched_percentage = watchedPercentage;
                
                await historyEntry.update(updateData);
            } else {
                // Create new entry
                historyEntry = await WatchHistory.create({
                    profile_id: profileId,
                    media_id: mediaId,
                    watched_date: new Date(),
                    watched_duration: watchedDuration || 0,
                    watched_percentage: watchedPercentage || 0,
                    completed: false
                });
            }

            return this.handleSuccess(req, res, 201, {
                message: "Media marked as watched.",
                historyEntry
            });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }

    /**
     * Delete watch history item
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async deleteHistory(req, res) {
        const { historyId } = req.params;

        try {
            const historyItem = await WatchHistory.findByPk(historyId);

            if (!historyItem) {
                return this.handleError(req, res, 404, "Watch history item not found.");
            }

            await historyItem.destroy();

            return this.handleSuccess(req, res, 200, {
                message: "Watch history item deleted successfully."
            });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }
}

// Create a singleton instance
const watchHistoryController = new WatchHistoryController();

// Export the instance
module.exports = watchHistoryController;
