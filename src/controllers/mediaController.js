const BaseController = require('./BaseController');
const { mediaService } = require('../services');
const { Profile } = require('../models/Profile');

/**
 * Controller for handling media-related operations
 * Uses mediaService for business logic
 */
class MediaController extends BaseController {
    /**
     * Get all media with optional filtering
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getAllMedia(req, res) {
        try {
            // Convert query parameters to appropriate types
            const options = this.convertParams(req.query, {
                page: 'number',
                limit: 'number',
                genre: 'string',
                type: 'string',
                classification: 'string'
            });
            
            const result = await mediaService.getAllMedia(options);
            
            return this.handleSuccess(req, res, 200, result);
        } catch (error) {
            console.error(error);
            if (error.name === 'SequelizeDatabaseError') {
                return this.handleError(req, res, 400, "Invalid query parameters", error.message);
            }
            return this.handleError(req, res, 500, "Error retrieving media", error.message);
        }
    }
    
    /**
     * Get media by ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getMediaById(req, res) {
        try {
            const { mediaId } = req.params;
            
            if (!mediaId) {
                return this.handleError(req, res, 400, "Media ID is required");
            }
            
            const media = await mediaService.getMediaById(mediaId);
            
            if (!media) {
                return this.handleError(req, res, 404, "Media not found");
            }
            
            return this.handleSuccess(req, res, 200, { media });
        } catch (error) {
            console.error(error);
            if (error.name === 'SequelizeDatabaseError' && error.message.includes('invalid input syntax')) {
                return this.handleError(req, res, 400, "Invalid media ID format");
            }
            return this.handleError(req, res, 500, "Error retrieving media", error.message);
        }
    }
    
    /**
     * Add media to watch list
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async addToWatchList(req, res) {
        try {
            const { profileId, mediaId } = req.body;
            
            const validation = this.validateRequiredFields(req.body, ['profileId', 'mediaId']);
            if (!validation.isValid) {
                return this.handleError(req, res, 400, "Profile ID and Media ID are required");
            }
            
            // Verify the profile belongs to the authenticated user
            const userId = req.userId;
            const profile = await Profile.findOne({
                where: {
                    id: profileId,
                    user_id: userId
                }
            });
            
            if (!profile) {
                return this.handleError(req, res, 403, "You don't have permission to modify this profile's watch list");
            }
            
            const watchListEntry = await mediaService.addToWatchList(profileId, mediaId);
            
            return this.handleSuccess(req, res, 201, { 
                message: "Added to watch list",
                watchListEntry
            });
        } catch (error) {
            console.error(error);
            if (error.name === 'SequelizeUniqueConstraintError') {
                return this.handleError(req, res, 409, "Media is already in the watch list");
            }
            if (error.message && error.message.includes('not found')) {
                return this.handleError(req, res, 404, error.message);
            }
            return this.handleError(req, res, 500, "Error adding to watch list", error.message);
        }
    }
    
    /**
     * Mark media as watched
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async markAsWatched(req, res) {
        try {
            const { profileId, mediaId, progress } = req.body;
            
            const validation = this.validateRequiredFields(req.body, ['profileId', 'mediaId']);
            if (!validation.isValid) {
                return this.handleError(req, res, 400, "Profile ID and Media ID are required");
            }
            
            // Verify the profile belongs to the authenticated user
            const userId = req.userId;
            const profile = await Profile.findOne({
                where: {
                    id: profileId,
                    user_id: userId
                }
            });
            
            if (!profile) {
                return this.handleError(req, res, 403, "You don't have permission to modify this profile's watch history");
            }
            
            const watchHistoryEntry = await mediaService.markAsWatched(profileId, mediaId, progress);
            
            return this.handleSuccess(req, res, 200, { 
                message: "Marked as watched",
                watchHistoryEntry
            });
        } catch (error) {
            console.error(error);
            if (error.message && error.message.includes('not found')) {
                return this.handleError(req, res, 404, error.message);
            }
            return this.handleError(req, res, 500, "Error marking as watched", error.message);
        }
    }
    
    /**
     * Get watch history for a profile
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getWatchHistory(req, res) {
        try {
            const { profileId } = req.params;
            const limit = req.query.limit ? parseInt(req.query.limit) : 20;
            
            if (!profileId) {
                return this.handleError(req, res, 400, "Profile ID is required");
            }
            
            // Verify the profile belongs to the authenticated user
            const userId = req.userId;
            const profile = await Profile.findOne({
                where: {
                    id: profileId,
                    user_id: userId
                }
            });
            
            if (!profile) {
                return this.handleError(req, res, 403, "You don't have permission to access this profile's watch history");
            }
            
            const history = await mediaService.getWatchHistory(profileId, limit);
            
            return this.handleSuccess(req, res, 200, { history });
        } catch (error) {
            console.error(error);
            if (error.name === 'SequelizeDatabaseError') {
                return this.handleError(req, res, 400, "Invalid query parameters", error.message);
            }
            return this.handleError(req, res, 500, "Error retrieving watch history", error.message);
        }
    }
    
    /**
     * Get watch list for a profile
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getWatchList(req, res) {
        try {
            const { profileId } = req.params;
            const limit = req.query.limit ? parseInt(req.query.limit) : 20;
            
            if (!profileId) {
                return this.handleError(req, res, 400, "Profile ID is required");
            }
            
            // Verify the profile belongs to the authenticated user
            const userId = req.userId;
            const profile = await Profile.findOne({
                where: {
                    id: profileId,
                    user_id: userId
                }
            });
            
            if (!profile) {
                return this.handleError(req, res, 403, "You don't have permission to access this profile's watch list");
            }
            
            const watchList = await mediaService.getWatchList(profileId, limit);
            
            return this.handleSuccess(req, res, 200, { watchList });
        } catch (error) {
            console.error(error);
            if (error.name === 'SequelizeDatabaseError') {
                return this.handleError(req, res, 400, "Invalid query parameters", error.message);
            }
            return this.handleError(req, res, 500, "Error retrieving watch list", error.message);
        }
    }
    
    /**
     * Search media
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async searchMedia(req, res) {
        try {
            const { query } = req.query;
            const limit = req.query.limit ? parseInt(req.query.limit) : 20;
            
            if (!query) {
                return this.handleError(req, res, 400, "Search query is required");
            }
            
            const results = await mediaService.searchMedia(query, limit);
            
            return this.handleSuccess(req, res, 200, { 
                results,
                count: results.length
            });
        } catch (error) {
            console.error(error);
            if (error.name === 'SequelizeDatabaseError') {
                return this.handleError(req, res, 400, "Invalid search parameters", error.message);
            }
            return this.handleError(req, res, 500, "Error searching media", error.message);
        }
    }
    
    /**
     * Get recommended content for a profile
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getRecommendedContent(req, res) {
        try {
            const { profileId } = req.params;
            const limit = req.query.limit ? parseInt(req.query.limit) : 10;
            
            if (!profileId) {
                return this.handleError(req, res, 400, "Profile ID is required");
            }
            
            // Verify the profile belongs to the authenticated user
            const userId = req.userId;
            const profile = await Profile.findOne({
                where: {
                    id: profileId,
                    user_id: userId
                }
            });
            
            if (!profile) {
                return this.handleError(req, res, 403, "You don't have permission to access this profile's recommendations");
            }
            
            const recommendations = await mediaService.getRecommendedContent(profileId, limit);
            
            return this.handleSuccess(req, res, 200, { recommendations });
        } catch (error) {
            console.error(error);
            if (error.name === 'SequelizeDatabaseError') {
                return this.handleError(req, res, 400, "Invalid request parameters", error.message);
            }
            return this.handleError(req, res, 500, "Error retrieving recommendations", error.message);
        }
    }
}

// Create a singleton instance
const mediaController = new MediaController();

// Export the instance
module.exports = mediaController;
