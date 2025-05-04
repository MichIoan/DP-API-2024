const DbUtils = require('../utils/dbUtils');
const { Subscription, SubscriptionStatus } = require('../models/Subscription');
const SubscriptionType = require('../models/enums/SubscriptionType');
const sequelize = require('../config/sequelize');

/**
 * Service for handling subscription-related operations
 * Uses stored procedures and transactions for data integrity
 */
class SubscriptionService {
    /**
     * Create or update a user subscription using stored procedure
     * @param {number} userId - User ID
     * @param {string} subscriptionType - Type of subscription (SD, HD, UHD)
     * @returns {Promise<Object>} - Result of the operation
     */
    async updateSubscription(userId, subscriptionType) {
        // Validate subscription type
        if (!SubscriptionType.isValid(subscriptionType)) {
            throw new Error('Invalid subscription type');
        }
        
        const transaction = await sequelize.transaction();
        
        try {
            // Call the stored procedure
            const result = await DbUtils.callStoredProcedure(
                'UpdateUserSubscription',
                [userId, subscriptionType],
                transaction
            );
            
            await transaction.commit();
            return result[0]; // Return the first row which contains the updated subscription
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    
    /**
     * Get a user's subscription
     * @param {number} userId - User ID
     * @returns {Promise<Object>} - User subscription
     */
    async getUserSubscription(userId) {
        return Subscription.findOne({
            where: { user_id: userId }
        });
    }
    
    /**
     * Get all subscriptions (admin only)
     * @returns {Promise<Array>} - All subscriptions
     */
    async getAllSubscriptions() {
        // Query the subscription_details view
        const query = `
            SELECT * FROM "subscription_details"
            ORDER BY start_date DESC;
        `;
        
        return sequelize.query(query, {
            type: sequelize.QueryTypes.SELECT
        });
    }
    
    /**
     * Cancel a user's subscription
     * @param {number} userId - User ID
     * @returns {Promise<boolean>} - Success status
     */
    async cancelSubscription(userId) {
        const transaction = await sequelize.transaction();
        
        try {
            const subscription = await Subscription.findOne({
                where: { user_id: userId },
                transaction
            });
            
            if (!subscription) {
                await transaction.rollback();
                return false;
            }
            
            // Update status to cancelled
            await subscription.update({
                status: SubscriptionStatus.CANCELLED,
                end_date: new Date()
            }, { transaction });
            
            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    
    /**
     * Get recommended content based on subscription type
     * @param {number} profileId - Profile ID
     * @returns {Promise<Array>} - Recommended content
     */
    async getRecommendedContent(profileId) {
        // Call the stored procedure
        const result = await DbUtils.callStoredProcedure(
            'GetRecommendedContent',
            [profileId, 10] // Limit to 10 recommendations
        );
        
        return result;
    }
}

// Create a singleton instance
const subscriptionService = new SubscriptionService();

// Export the instance
module.exports = subscriptionService;
