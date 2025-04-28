const BaseController = require('./BaseController');
const SubscriptionService = require('../services/subscriptionService');
const { Subscription } = require('../models/Subscription');
const User = require('../models/User');

/**
 * Controller for handling subscription-related operations
 * Uses SubscriptionService for business logic
 */
class SubscriptionController extends BaseController {
    /**
     * Get all subscriptions
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getAllSubscriptions(req, res) {
        try {
            const subscriptions = await Subscription.findAll({
                include: [
                    {
                        model: User,
                        attributes: ["email", "has_discount", "referral_id"], 
                    },
                ],
            });
    
            if (!subscriptions.length) {
                return this.handleError(req, res, 404, "No subscriptions found.");
            }
    
            return this.handleSuccess(req, res, 200, { subscriptions });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Error retrieving subscriptions", error.message);
        }
    }

    /**
     * Get subscription for a user
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getUserSubscription(req, res) {
        try {
            const userId = req.userId; // From auth middleware
            
            const subscription = await SubscriptionService.getUserSubscription(userId);
            
            if (!subscription) {
                return this.handleError(req, res, 404, "No subscription found for this user.");
            }
            
            return this.handleSuccess(req, res, 200, { subscription });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Error retrieving user subscription", error.message);
        }
    }
    
    /**
     * Create a new subscription
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async createSubscription(req, res) {
        try {
            const userId = req.userId; // From auth middleware
            const { subscriptionType } = req.body;
            
            if (!subscriptionType) {
                return this.handleError(req, res, 400, "Subscription type is required");
            }
            
            const result = await SubscriptionService.updateSubscription(userId, subscriptionType);
            
            return this.handleSuccess(req, res, 201, result);
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Error creating subscription", error.message);
        }
    }

    /**
     * Update a subscription
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async updateSubscription(req, res) {
        try {
            const userId = req.userId; // From auth middleware
            const { subscriptionType } = req.body;
            
            if (!subscriptionType) {
                return this.handleError(req, res, 400, "Subscription type is required");
            }
            
            const result = await SubscriptionService.updateSubscription(userId, subscriptionType);
            
            return this.handleSuccess(req, res, 200, result);
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Error updating subscription", error.message);
        }
    }
    
    /**
     * Cancel a subscription
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async cancelSubscription(req, res) {
        try {
            const userId = req.userId; // From auth middleware
            
            const result = await SubscriptionService.cancelSubscription(userId);
            
            return this.handleSuccess(req, res, 200, result);
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Error canceling subscription", error.message);
        }
    }
    
    /**
     * Get recommended content for a user profile
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getRecommendedContent(req, res) {
        try {
            const { profileId } = req.params;
            const limit = req.query.limit ? parseInt(req.query.limit) : 10;
            
            const recommendations = await SubscriptionService.getRecommendedContent(profileId, limit);
            
            return this.handleSuccess(req, res, 200, { recommendations });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Error getting recommendations", error.message);
        }
    }
}

// Create a singleton instance
const subscriptionController = new SubscriptionController();

// Export the instance
module.exports = subscriptionController;
