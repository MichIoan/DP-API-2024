const BaseController = require('./BaseController');
const { SubscriptionService } = require('../services');
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
            const subscriptions = await SubscriptionService.getAllSubscriptions();
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
            
            const subscription = await SubscriptionService.getUserSubscription(userId);
            
            if (!subscription) {
                return this.handleError(req, res, 404, "No subscription found for this user");
            }
            
            return this.handleSuccess(req, res, 200, { subscription });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Error retrieving subscription", error.message);
        }
    }

    /**
     * Create subscription
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async createSubscription(req, res) {
        try {
            const userId = req.userId; // From auth middleware
            const { subscriptionType } = req.body;
            
            const validation = this.validateRequiredFields(req.body, ['subscriptionType']);
            if (!validation.isValid) {
                return this.handleError(req, res, 400, "Subscription type is required");
            }
            
            const result = await SubscriptionService.updateSubscription(userId, subscriptionType);
            
            return this.handleSuccess(req, res, 201, {
                message: "Subscription created successfully",
                subscription: result
            });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Error creating subscription", error.message);
        }
    }

    /**
     * Update subscription
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async updateSubscription(req, res) {
        try {
            const userId = req.userId; // From auth middleware
            const { subscriptionType } = req.body;
            
            const validation = this.validateRequiredFields(req.body, ['subscriptionType']);
            if (!validation.isValid) {
                return this.handleError(req, res, 400, "Subscription type is required");
            }
            
            const result = await SubscriptionService.updateSubscription(userId, subscriptionType);
            
            return this.handleSuccess(req, res, 200, {
                message: "Subscription updated successfully",
                subscription: result
            });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Error updating subscription", error.message);
        }
    }

    /**
     * Cancel subscription
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async cancelSubscription(req, res) {
        try {
            const userId = req.userId; // From auth middleware
            
            const result = await SubscriptionService.cancelSubscription(userId);
            
            if (!result) {
                return this.handleError(req, res, 404, "No active subscription found");
            }
            
            return this.handleSuccess(req, res, 200, {
                message: "Subscription canceled successfully"
            });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Error canceling subscription", error.message);
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
            
            const recommendations = await SubscriptionService.getRecommendedContent(profileId);
            
            return this.handleSuccess(req, res, 200, { recommendations });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Error retrieving recommendations", error.message);
        }
    }
}

// Create a singleton instance
const subscriptionController = new SubscriptionController();

// Export the instance
module.exports = subscriptionController;
