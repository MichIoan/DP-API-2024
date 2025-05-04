const BaseController = require('./BaseController');
const { watchListService } = require('../services');

/**
 * Controller for handling watch list operations
 * Extends BaseController to inherit common functionality
 */
class WatchListController extends BaseController {
    /**
     * Get watch list for a profile
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getWatchList(req, res) {
        const { profileId } = req.params;

        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : 20;
            const watchList = await watchListService.getWatchList(profileId, limit);
            
            if (watchList.length === 0) {
                return this.handleSuccess(req, res, 200, { 
                    message: "Watch list is empty",
                    watchList: [] 
                });
            }

            return this.handleSuccess(req, res, 200, { watchList });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Error retrieving watch list", error.message);
        }
    }

    /**
     * Add media to watch list
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async addToWatchList(req, res) {
        const { profileId, mediaId } = req.body;
    
        const validation = this.validateRequiredFields(req.body, ['profileId', 'mediaId']);
        if (!validation.isValid) {
            return this.handleError(req, res, 400, "Please provide profileId and mediaId.");
        }
    
        try {
            // Verify the profile belongs to the authenticated user
            const userId = req.userId;
            const isAuthorized = await this.verifyProfileOwnership(userId, profileId);
            
            if (!isAuthorized) {
                return this.handleError(req, res, 403, "You don't have permission to modify this profile's watch list");
            }
            
            const watchListEntry = await watchListService.addToWatchList(profileId, mediaId);
            
            return this.handleSuccess(req, res, 201, {
                message: "Added to watch list",
                watchListEntry
            });
        } catch (error) {
            console.error(error);
            // Handle duplicate entry specifically
            if (error.code === 'DUPLICATE_ENTRY') {
                return this.handleError(req, res, 409, "This media is already in your watch list");
            }
            // Default to 500 for other errors
            return this.handleError(req, res, 500, "Error adding to watch list", error.message);
        }
    }

    /**
     * Update watch list entry
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async updateWatchList(req, res) {
        const { watchListId } = req.params;
        const updateData = req.body;

        if (!watchListId) {
            return this.handleError(req, res, 400, "Watch list item ID is required");
        }

        try {
            // Verify the watch list entry belongs to the authenticated user
            const userId = req.userId;
            const isAuthorized = await this.verifyWatchListOwnership(userId, watchListId);
            
            if (!isAuthorized) {
                return this.handleError(req, res, 403, "You don't have permission to update this watch list entry");
            }
            
            const updatedEntry = await watchListService.updateWatchList(watchListId, updateData);
            
            if (!updatedEntry) {
                return this.handleError(req, res, 404, "Watch list entry not found");
            }
            
            return this.handleSuccess(req, res, 200, {
                message: "Watch list entry updated",
                watchListEntry: updatedEntry
            });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Error updating watch list entry", error.message);
        }
    }

    /**
     * Remove media from watch list
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async removeFromWatchList(req, res) {
        const { watchListId } = req.params;

        if (!watchListId) {
            return this.handleError(req, res, 400, "Watch list item ID is required");
        }

        try {
            // Get the watch list item first
            const watchListItem = await watchListService.getWatchListItemById(watchListId);
            
            if (!watchListItem) {
                return this.handleError(req, res, 404, "Watch list item not found");
            }

            // Verify ownership using the item's profile_id
            const userId = req.userId;
            const isAuthorized = await this.verifyProfileOwnership(userId, watchListItem.profile_id);
            
            if (!isAuthorized) {
                return this.handleError(req, res, 403, "You don't have permission to modify this profile's watch list");
            }

            await watchListService.removeFromWatchList(watchListId);
            
            return this.handleSuccess(req, res, 200, {
                message: "Item removed from watch list successfully"
            });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Error removing item from watch list", error.message);
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
     * Verify that a watch list entry belongs to the authenticated user
     * @param {number} userId - User ID
     * @param {number} watchListId - Watch list ID
     * @returns {Promise<boolean>} - Whether the entry belongs to the user
     * @private
     */
    async verifyWatchListOwnership(userId, watchListId) {
        try {
            // This would typically use a join query, but for simplicity we'll use a raw query
            const { WatchList } = require('../models/WatchList');
            const query = `
                SELECT wl.id 
                FROM "watch_lists" wl
                JOIN "profiles" p ON wl.profile_id = p.id
                WHERE wl.id = :watchListId AND p.user_id = :userId
            `;
            
            const result = await WatchList.sequelize.query(query, {
                replacements: { watchListId, userId },
                type: WatchList.sequelize.QueryTypes.SELECT
            });
            
            return result.length > 0;
        } catch (error) {
            console.error('Error verifying watch list ownership:', error);
            return false;
        }
    }
}

// Create a singleton instance
const watchListController = new WatchListController();

// Export the instance
module.exports = watchListController;
