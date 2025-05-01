const BaseController = require('./BaseController');
const WatchList = require("../models/WatchList");

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
            const query = `
                SELECT * FROM "watch_list_details"
                WHERE profile_id = :profileId;
            `;
            
            const result = await WatchList.sequelize.query(query, {
                replacements: { profileId },
                type: WatchList.sequelize.QueryTypes.SELECT,
            });

            if (result.length === 0) {
                return this.handleError(req, res, 404, "No movies found in the watchlist.");
            }

            return this.handleSuccess(req, res, 200, {
                watchlist: result,
            });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }

    /**
     * Update watch list item
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async updateWatchList(req, res) {
        const { watchListId } = req.params;
        const { status } = req.body;

        const validation = this.validateRequiredFields(req.body, ['status']);
        if (!validation.isValid) {
            return this.handleError(req, res, 400, "Status is required");
        }

        try {
            const watchListItem = await WatchList.findByPk(watchListId);

            if (!watchListItem) {
                return this.handleError(req, res, 404, "Watch list item not found");
            }

            await watchListItem.update({ status });

            return this.handleSuccess(req, res, 200, {
                message: "Watch list item updated successfully",
                watchListItem
            });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }

    /**
     * Add item to watch list
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async addToWatchList(req, res) {
        const { profileId, mediaId } = req.body;

        const validation = this.validateRequiredFields(req.body, ['profileId', 'mediaId']);
        if (!validation.isValid) {
            return this.handleError(req, res, 400, "Profile ID and Media ID are required");
        }

        try {
            // Check if item already exists in watchlist
            const existingItem = await WatchList.findOne({
                where: {
                    profile_id: profileId,
                    media_id: mediaId
                }
            });

            if (existingItem) {
                return this.handleError(req, res, 409, "Item already exists in watchlist");
            }

            const watchListEntry = await WatchList.create({
                profile_id: profileId,
                media_id: mediaId,
                status: 'added',
                added_date: new Date()
            });

            return this.handleSuccess(req, res, 201, {
                message: "Added to watch list",
                watchListEntry
            });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }

    /**
     * Remove item from watch list
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async removeFromWatchList(req, res) {
        const { watchListId } = req.params;

        try {
            const watchListItem = await WatchList.findByPk(watchListId);

            if (!watchListItem) {
                return this.handleError(req, res, 404, "Watch list item not found");
            }

            await watchListItem.destroy();

            return this.handleSuccess(req, res, 200, {
                message: "Item removed from watch list"
            });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }
}

// Create a singleton instance
const watchListController = new WatchListController();

// Export the instance
module.exports = watchListController;
