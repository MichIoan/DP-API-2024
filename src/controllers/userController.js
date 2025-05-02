const BaseController = require("./BaseController");
const { UserService } = require("../services");
const User = require("../models/User");

/**
 * Controller for handling user account operations
 * Extends BaseController to inherit common functionality
 */
class UserController extends BaseController {
    /**
     * Get user account information
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getUserAccount(req, res) {
        try {
            const userId = req.userId;
            
            const user = await UserService.getUserById(userId);
            
            if (!user) {
                return this.handleError(req, res, 404, "User not found");
            }
            
            return this.handleSuccess(req, res, 200, { user });
        } catch (error) {
            console.error("Error getting user account:", error);
            return this.handleError(req, res, 500, "Failed to retrieve user account", error.message);
        }
    }
    
    /**
     * Update user account information
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async updateUserAccount(req, res) {
        try {
            const userId = req.userId;
            const userData = req.body;
            
            // Update user using service
            const updatedUser = await UserService.updateUser(userId, userData);
            
            return this.handleSuccess(req, res, 200, { 
                message: "User account updated successfully",
                user: updatedUser
            });
        } catch (error) {
            console.error("Error updating user account:", error);
            return this.handleError(req, res, 500, "Failed to update user account", error.message);
        }
    }
    
    /**
     * Delete user account
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async deleteUserAccount(req, res) {
        try {
            const userId = req.userId;
            const { password } = req.body;
            
            const validation = this.validateRequiredFields(req.body, ['password']);
            if (!validation.isValid) {
                return this.handleError(req, res, 400, "Password is required");
            }
            
            // Verify password and delete user using service
            const user = await User.findByPk(userId);
            if (!user) {
                return this.handleError(req, res, 404, "User not found");
            }
            
            // Delete user
            await UserService.deleteUser(userId);
            
            return this.handleSuccess(req, res, 200, { 
                message: "Account deleted successfully" 
            });
        } catch (error) {
            console.error("Error deleting user account:", error);
            return this.handleError(req, res, 500, "Failed to delete user account", error.message);
        }
    }
    
    /**
     * Get users referred by the current user
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getReferredUsers(req, res) {
        try {
            const userId = req.userId;
            
            const referredUsers = await UserService.getReferredUsers(userId);
            
            return this.handleSuccess(req, res, 200, { referredUsers });
        } catch (error) {
            console.error("Error getting referred users:", error);
            return this.handleError(req, res, 500, "Failed to retrieve referred users", error.message);
        }
    }
    
    /**
     * Apply a referral code
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async applyReferralCode(req, res) {
        try {
            const userId = req.userId;
            const { referralCode } = req.body;
            
            const validation = this.validateRequiredFields(req.body, ['referralCode']);
            if (!validation.isValid) {
                return this.handleError(req, res, 400, "Referral code is required");
            }
            
            const result = await UserService.applyReferralCode(userId, referralCode);
            
            return this.handleSuccess(req, res, 200, result);
        } catch (error) {
            console.error("Error applying referral code:", error);
            return this.handleError(req, res, 500, "Failed to apply referral code", error.message);
        }
    }
}

// Create a singleton instance
const userController = new UserController();

// Export the instance
module.exports = userController;
