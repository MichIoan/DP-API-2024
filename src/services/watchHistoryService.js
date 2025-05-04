const { WatchHistory } = require('../models/WatchHistory');
const { Media } = require('../models/Media');
const { Profile } = require('../models/Profile');
const sequelize = require('../config/sequelize');
const DbUtils = require('../utils/dbUtils');

/**
 * Service for handling watch history operations
 * Uses stored procedures and transactions for data integrity
 */
class WatchHistoryService {
    /**
     * Get watch history for a profile
     * @param {number} profileId - Profile ID
     * @param {number} limit - Maximum number of records to return
     * @returns {Promise<Array>} - Watch history records
     */
    async getHistory(profileId, limit = 20) {
        try {
            // Use the watch_history_details view
            const query = `
                SELECT * FROM "watch_history_details"
                WHERE profile_id = :profileId
                ORDER BY watched_at DESC
                LIMIT :limit;
            `;
            
            const result = await sequelize.query(query, {
                replacements: { profileId, limit },
                type: sequelize.QueryTypes.SELECT,
            });
            
            return result;
        } catch (error) {
            console.error('Error getting watch history:', error);
            throw error;
        }
    }
    
    /**
     * Mark media as watched
     * @param {number} profileId - Profile ID
     * @param {number} mediaId - Media ID
     * @param {number} progress - Watching progress (0-100)
     * @returns {Promise<Object>} - Created watch history record
     */
    async markAsWatched(profileId, mediaId, progress = 100) {
        try {
            // Start a transaction
            const transaction = await sequelize.transaction();
            
            try {
                // Check if there's an existing record
                let watchHistory = await WatchHistory.findOne({
                    where: {
                        profile_id: profileId,
                        media_id: mediaId
                    },
                    transaction
                });
                
                if (watchHistory) {
                    // Update existing record
                    watchHistory = await watchHistory.update({
                        progress,
                        watched_at: new Date()
                    }, { transaction });
                } else {
                    // Create new record
                    watchHistory = await WatchHistory.create({
                        profile_id: profileId,
                        media_id: mediaId,
                        progress,
                        watched_at: new Date()
                    }, { transaction });
                }
                
                // Commit the transaction
                await transaction.commit();
                
                // Return the watch history with media details
                return await WatchHistory.findByPk(watchHistory.id, {
                    include: [
                        { model: Media },
                        { model: Profile }
                    ]
                });
            } catch (error) {
                // Rollback the transaction on error
                await transaction.rollback();
                throw error;
            }
        } catch (error) {
            console.error('Error marking as watched:', error);
            throw error;
        }
    }
    
    /**
     * Update watch history record
     * @param {number} historyId - Watch history ID
     * @param {Object} data - Update data
     * @returns {Promise<Object>} - Updated watch history record
     */
    async updateHistory(historyId, data) {
        try {
            // Find the watch history record
            const watchHistory = await WatchHistory.findByPk(historyId);
            
            if (!watchHistory) {
                return null;
            }
            
            // Update the record
            await watchHistory.update(data);
            
            // Return the updated record with associations
            return await WatchHistory.findByPk(historyId, {
                include: [
                    { model: Media },
                    { model: Profile }
                ]
            });
        } catch (error) {
            console.error('Error updating watch history:', error);
            throw error;
        }
    }
    
    /**
     * Delete watch history record
     * @param {number} historyId - Watch history ID
     * @returns {Promise<boolean>} - True if deleted, false if not found
     */
    async deleteHistory(historyId) {
        try {
            // Find the watch history record
            const watchHistory = await WatchHistory.findByPk(historyId);
            
            if (!watchHistory) {
                return false;
            }
            
            // Delete the record
            await watchHistory.destroy();
            
            return true;
        } catch (error) {
            console.error('Error deleting watch history:', error);
            throw error;
        }
    }
    
    /**
     * Get recommended content based on watch history
     * @param {number} profileId - Profile ID
     * @param {number} limit - Maximum number of recommendations
     * @returns {Promise<Array>} - Recommended media
     */
    async getRecommendations(profileId, limit = 10) {
        try {
            // Call the stored procedure for recommendations
            return await DbUtils.callProcedure('GetRecommendedContent', [profileId, limit]);
        } catch (error) {
            console.error('Error getting recommendations:', error);
            throw error;
        }
    }
}

// Create a singleton instance
const watchHistoryService = new WatchHistoryService();

// Export the instance
module.exports = watchHistoryService;
