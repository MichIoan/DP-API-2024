const BaseController = require('./BaseController');
const { subscriptionService } = require('../services');
const { Subscription } = require('../models/Subscription');
const User = require('../models/User');

/**
 * Controller for handling subscription-related operations
 * Uses subscriptionService for business logic
 */
class SubscriptionController extends BaseController {
    /**
     * Get all subscriptions
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getAllSubscriptions(req, res) {
        try {
            const subscriptions = await subscriptionService.getAllSubscriptions();
            return this.handleSuccess(req, res, 200, { subscriptions });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Error retrieving subscriptions", error.message);
        }
    }

    /**
     * Get user subscription
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getUserSubscription(req, res) {
        try {
            const userId = req.userId; // From auth middleware
            
            const subscription = await subscriptionService.getUserSubscription(userId);
            
            if (!subscription) {
                return this.handleSuccess(req, res, 200, { 
                    message: "No subscription found for this user",
                    subscription: null
                });
            }
            
            return this.handleSuccess(req, res, 200, { subscription });
        } catch (error) {
            console.error(error);
            if (error.name === 'SequelizeDatabaseError') {
                return this.handleError(req, res, 400, "Invalid request parameters", error.message);
            }
            return this.handleError(req, res, 500, "Error retrieving subscription", error.message);
        }
    }

    /**
     * Create a subscription
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
            
            // Check if user already has a subscription
            const existingSubscription = await subscriptionService.getUserSubscription(userId);
            if (existingSubscription) {
                return this.handleError(req, res, 409, "User already has an active subscription. Use update endpoint instead.");
            }
            
            // Use stored procedure via DbUtils
            const result = await subscriptionService.updateSubscription(userId, subscriptionType);
            
            return this.handleSuccess(req, res, 201, {
                message: "Subscription created successfully",
                subscription: result
            });
        } catch (error) {
            console.error(error);
            if (error.message && error.message.includes('Invalid subscription type')) {
                return this.handleError(req, res, 422, error.message);
            }
            if (error.message && error.message.includes('Payment required')) {
                return this.handleError(req, res, 402, "Payment required to create subscription");
            }
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
            
            // Check if user has a subscription
            const existingSubscription = await subscriptionService.getUserSubscription(userId);
            if (!existingSubscription) {
                return this.handleError(req, res, 404, "No subscription found. Use create endpoint instead.");
            }
            
            // Use stored procedure via DbUtils
            const result = await subscriptionService.updateSubscription(userId, subscriptionType);
            
            return this.handleSuccess(req, res, 200, {
                message: "Subscription updated successfully",
                subscription: result
            });
        } catch (error) {
            console.error(error);
            if (error.message && error.message.includes('Invalid subscription type')) {
                return this.handleError(req, res, 422, error.message);
            }
            if (error.message && error.message.includes('Payment required')) {
                return this.handleError(req, res, 402, "Payment required to upgrade subscription");
            }
            if (error.message && error.message.includes('Downgrade not allowed')) {
                return this.handleError(req, res, 403, "Downgrade not allowed during active billing period");
            }
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
            
            const result = await subscriptionService.cancelSubscription(userId);
            
            if (!result) {
                return this.handleError(req, res, 404, "No active subscription found");
            }
            
            return this.handleSuccess(req, res, 200, {
                message: "Subscription cancelled successfully"
            });
        } catch (error) {
            console.error(error);
            if (error.message && error.message.includes('Cancellation period')) {
                return this.handleError(req, res, 403, error.message);
            }
            return this.handleError(req, res, 500, "Error cancelling subscription", error.message);
        }
    }

    /**
     * Get recommended content based on subscription
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getRecommendedContent(req, res) {
        try {
            const { profileId } = req.params;
            
            if (!profileId) {
                return this.handleError(req, res, 400, "Profile ID is required");
            }
            
            // Call stored procedure via DbUtils
            const recommendations = await subscriptionService.getRecommendedContent(profileId);
            
            return this.handleSuccess(req, res, 200, { recommendations });
        } catch (error) {
            console.error(error);
            if (error.message && error.message.includes('not found')) {
                return this.handleError(req, res, 404, error.message);
            }
            if (error.message && error.message.includes('subscription required')) {
                return this.handleError(req, res, 402, "Subscription required to access premium recommendations");
            }
            return this.handleError(req, res, 500, "Error retrieving recommendations", error.message);
        }
    }
}

// Create a singleton instance
const subscriptionController = new SubscriptionController();

// Export the instance
module.exports = subscriptionController;
