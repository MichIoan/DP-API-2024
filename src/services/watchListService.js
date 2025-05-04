const { WatchList } = require('../models/WatchList');
const { Media } = require('../models/Media');
const { Profile } = require('../models/Profile');
const sequelize = require('../config/sequelize');

/**
 * Service for handling watch list operations
 * Uses transactions for data integrity
 */
class WatchListService {
    /**
     * Get watch list for a profile
     * @param {number} profileId - Profile ID
     * @param {number} limit - Maximum number of records to return
     * @returns {Promise<Array>} - Watch list records
     */
    async getWatchList(profileId, limit = 20) {
        try {
            // Use the watch_list_details view
            const query = `
                SELECT * FROM "watch_list_details"
                WHERE profile_id = :profileId
                ORDER BY added_date DESC
                LIMIT :limit;
            `;
            
            const result = await sequelize.query(query, {
                replacements: { profileId, limit },
                type: sequelize.QueryTypes.SELECT,
            });
            
            return result;
        } catch (error) {
            console.error('Error getting watch list:', error);
            throw error;
        }
    }
    
    /**
     * Add media to watch list
     * @param {number} profileId - Profile ID
     * @param {number} mediaId - Media ID
     * @returns {Promise<Object>} - Created watch list record
     */
    async addToWatchList(profileId, mediaId) {
        try {
            // Start a transaction
            const transaction = await sequelize.transaction();
            
            try {
                // Check if there's an existing record
                let watchList = await WatchList.findOne({
                    where: {
                        profile_id: profileId,
                        media_id: mediaId
                    },
                    transaction
                });
                
                if (watchList) {
                    // Update existing record
                    watchList = await watchList.update({
                        added_date: new Date()
                    }, { transaction });
                } else {
                    // Create new record
                    watchList = await WatchList.create({
                        profile_id: profileId,
                        media_id: mediaId,
                        added_date: new Date()
                    }, { transaction });
                }
                
                // Commit the transaction
                await transaction.commit();
                
                // Return the watch list with media details
                return await WatchList.findByPk(watchList.id, {
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
            console.error('Error adding to watch list:', error);
            throw error;
        }
    }
    
    /**
     * Update watch list record
     * @param {number} watchListId - Watch list ID
     * @param {Object} data - Update data
     * @returns {Promise<Object>} - Updated watch list record
     */
    async updateWatchList(watchListId, data) {
        try {
            // Find the watch list record
            const watchList = await WatchList.findByPk(watchListId);
            
            if (!watchList) {
                return null;
            }
            
            // Update the record
            await watchList.update(data);
            
            // Return the updated record with associations
            return await WatchList.findByPk(watchListId, {
                include: [
                    { model: Media },
                    { model: Profile }
                ]
            });
        } catch (error) {
            console.error('Error updating watch list:', error);
            throw error;
        }
    }
    
    /**
     * Remove media from watch list
     * @param {number} watchListId - Watch list ID
     * @returns {Promise<boolean>} - True if removed, false if not found
     */
    async removeFromWatchList(watchListId) {
        try {
            // Find the watch list record
            const watchList = await WatchList.findByPk(watchListId);
            
            if (!watchList) {
                return false;
            }
            
            // Delete the record
            await watchList.destroy();
            
            return true;
        } catch (error) {
            console.error('Error removing from watch list:', error);
            throw error;
        }
    }
}

// Create a singleton instance
const watchListService = new WatchListService();

// Export the instance
module.exports = watchListService;
