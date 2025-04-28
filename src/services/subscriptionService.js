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
    static async updateSubscription(userId, subscriptionType) {
        // Validate subscription type
        if (!SubscriptionType.isValid(subscriptionType)) {
            throw new Error('Invalid subscription type');
        }
        
        // Get price based on subscription type
        const price = SubscriptionType.getPrice(subscriptionType);
        
        try {
            // Call the stored procedure
            await DbUtils.callProcedure('UpdateUserSubscription', [
                userId,
                subscriptionType,
                price
            ]);
            
            return {
                success: true,
                message: 'Subscription updated successfully',
                type: subscriptionType,
                price: price
            };
        } catch (error) {
            console.error('Error updating subscription:', error);
            throw error;
        }
    }
    
    /**
     * Get subscription details for a user
     * @param {number} userId - User ID
     * @returns {Promise<Object>} - Subscription details
     */
    static async getUserSubscription(userId) {
        try {
            // Query the subscription_details view
            const subscriptions = await DbUtils.queryView('subscription_details', { user_id: userId });
            
            if (!subscriptions || subscriptions.length === 0) {
                return null;
            }
            
            return subscriptions[0];
        } catch (error) {
            console.error('Error getting user subscription:', error);
            throw error;
        }
    }
    
    /**
     * Cancel a user's subscription
     * @param {number} userId - User ID
     * @returns {Promise<Object>} - Result of the operation
     */
    static async cancelSubscription(userId) {
        return await DbUtils.withTransaction(async (transaction) => {
            // Find active subscription
            const subscription = await Subscription.findOne({
                where: {
                    user_id: userId,
                    status: SubscriptionStatus.ACTIVE
                },
                transaction
            });
            
            if (!subscription) {
                throw new Error('No active subscription found');
            }
            
            // Update subscription status
            await subscription.update({
                status: SubscriptionStatus.CANCELED,
                end_date: new Date()
            }, { transaction });
            
            return {
                success: true,
                message: 'Subscription canceled successfully'
            };
        });
    }
    
    /**
     * Get recommended content for a user profile
     * @param {number} profileId - Profile ID
     * @param {number} limit - Maximum number of recommendations
     * @returns {Promise<Array>} - Recommended content
     */
    static async getRecommendedContent(profileId, limit = 10) {
        try {
            // Call the GetRecommendedContent function
            const recommendations = await DbUtils.callFunction('GetRecommendedContent', [profileId, limit]);
            return recommendations;
        } catch (error) {
            console.error('Error getting recommended content:', error);
            throw error;
        }
    }
}

module.exports = SubscriptionService;
