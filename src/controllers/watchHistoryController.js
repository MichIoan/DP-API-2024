const BaseController = require('./BaseController');
const { watchHistoryService } = require('../services');

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
            const limit = req.query.limit ? parseInt(req.query.limit) : 20;
            const history = await watchHistoryService.getHistory(profileId, limit);
            
            return this.handleSuccess(req, res, 200, { history });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Error retrieving watch history", error.message);
        }
    }

    /**
     * Mark media as watched
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async markAsWatched(req, res) {
        const { profileId, mediaId, progress } = req.body;

        const validation = this.validateRequiredFields(req.body, ['profileId', 'mediaId']);
        if (!validation.isValid) {
            return this.handleError(req, res, 400, "Please provide profileId and mediaId.");
        }

        try {
            // Verify the profile belongs to the authenticated user
            const userId = req.userId;
            const isAuthorized = await this.verifyProfileOwnership(userId, profileId);
            
            if (!isAuthorized) {
                return this.handleError(req, res, 403, "You don't have permission to modify this profile's watch history");
            }
            
            const watchProgress = progress || 100;
            const history = await watchHistoryService.markAsWatched(profileId, mediaId, watchProgress);
            
            return this.handleSuccess(req, res, 200, {
                message: "Media marked as watched",
                history
            });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Error marking media as watched", error.message);
        }
    }

    /**
     * Update watch history record
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async updateHistory(req, res) {
        const { historyId } = req.params;
        const updateData = req.body;

        if (!historyId) {
            return this.handleError(req, res, 400, "Please provide a historyId to update.");
        }

        try {
            // Verify the history record belongs to the authenticated user
            const userId = req.userId;
            const isAuthorized = await this.verifyHistoryOwnership(userId, historyId);
            
            if (!isAuthorized) {
                return this.handleError(req, res, 403, "You don't have permission to update this watch history");
            }
            
            const updatedHistory = await watchHistoryService.updateHistory(historyId, updateData);
            
            if (!updatedHistory) {
                return this.handleError(req, res, 404, "Watch history record not found");
            }
            
            return this.handleSuccess(req, res, 200, {
                message: "Watch history updated",
                history: updatedHistory
            });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Error updating watch history", error.message);
        }
    }

    /**
     * Delete watch history record
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async deleteHistory(req, res) {
        const { historyId } = req.params;

        if (!historyId) {
            return this.handleError(req, res, 400, "Please provide a historyId to delete.");
        }

        try {
            // Verify the history record belongs to the authenticated user
            const userId = req.userId;
            const isAuthorized = await this.verifyHistoryOwnership(userId, historyId);
            
            if (!isAuthorized) {
                return this.handleError(req, res, 403, "You don't have permission to delete this watch history");
            }
            
            const result = await watchHistoryService.deleteHistory(historyId);
            
            if (!result) {
                return this.handleError(req, res, 404, "Watch history record not found");
            }
            
            return this.handleSuccess(req, res, 200, {
                message: "Watch history deleted successfully"
            });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Error deleting watch history", error.message);
        }
    }
    
    /**
     * Remove item from watch history
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async removeFromHistory(req, res) {
        const { historyId } = req.params;

        if (!historyId) {
            return this.handleError(req, res, 400, "History item ID is required");
        }

        try {
            // Get the history item first
            const historyItem = await watchHistoryService.getHistoryItemById(historyId);
            
            if (!historyItem) {
                return this.handleError(req, res, 404, "History item not found");
            }

            // Verify ownership using the item's profile_id
            const userId = req.userId;
            const isAuthorized = await this.verifyProfileOwnership(userId, historyItem.profile_id);
            
            if (!isAuthorized) {
                return this.handleError(req, res, 403, "You don't have permission to modify this profile's watch history");
            }

            await watchHistoryService.removeFromHistory(historyId);
            
            return this.handleSuccess(req, res, 200, {
                message: "Item removed from history successfully"
            });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Error removing item from history", error.message);
        }
    }
    
    /**
     * Verify that a profile belongs to the authenticated user
     * @param {number} userId - User ID
     * @param {number} profileId - Profile ID
     * @returns {Promise<boolean>} - Whether the profile belongs to the user
     * @private
     */
    async verifyProfileOwnership(userId, profileId) {
        try {
            // This would typically use profileService, but for simplicity we'll use a direct query
            const { Profile } = require('../models/Profile');
            const profile = await Profile.findOne({
                where: {
                    id: profileId,
                    user_id: userId
                }
            });
            
            return !!profile;
        } catch (error) {
            console.error('Error verifying profile ownership:', error);
            return false;
        }
    }
    
    /**
     * Verify that a watch history record belongs to the authenticated user
     * @param {number} userId - User ID
     * @param {number} historyId - Watch history ID
     * @returns {Promise<boolean>} - Whether the history belongs to the user
     * @private
     */
    async verifyHistoryOwnership(userId, historyId) {
        try {
            // This would typically use a join query, but for simplicity we'll use a raw query
            const { WatchHistory } = require('../models/WatchHistory');
            const query = `
                SELECT wh.id 
                FROM "watch_histories" wh
                JOIN "profiles" p ON wh.profile_id = p.id
                WHERE wh.id = :historyId AND p.user_id = :userId
            `;
            
            const result = await WatchHistory.sequelize.query(query, {
                replacements: { historyId, userId },
                type: WatchHistory.sequelize.QueryTypes.SELECT
            });
            
            return result.length > 0;
        } catch (error) {
            console.error('Error verifying history ownership:', error);
            return false;
        }
    }
}

// Create a singleton instance
const watchHistoryController = new WatchHistoryController();

// Export the instance
module.exports = watchHistoryController;
