const BaseController = require("./BaseController");
const User = require("../models/User");
const UserStatus = require("../models/enums/UserStatus");
const bcrypt = require("bcrypt");
const sequelize = require("../config/sequelize");

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
            
            const user = await User.findByPk(userId, {
                attributes: { exclude: ['password'] }
            });
            
            if (!user) {
                return this.handleError(req, res, 404, "User not found");
            }
            
            return this.handleSuccess(req, res, 200, { user });
        } catch (error) {
            console.error("Error getting user account:", error);
            return this.handleError(req, res, 500, "Failed to retrieve user account");
        }
    }
    
    /**
     * Update user account information
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async updateUserAccount(req, res) {
        const transaction = await sequelize.transaction();
        
        try {
            const userId = req.userId;
            const { email, currentPassword, newPassword } = req.body;
            
            const user = await User.findByPk(userId);
            if (!user) {
                await transaction.rollback();
                return this.handleError(req, res, 404, "User not found");
            }
            
            // Prepare update data
            const updateData = {};
            
            // Update email if provided
            if (email && email !== user.email) {
                const existingUser = await User.findOne({ where: { email }});
                if (existingUser) {
                    await transaction.rollback();
                    return this.handleError(req, res, 400, "Email is already in use");
                }
                
                updateData.email = email;
            }
            
            // Update password if provided
            if (currentPassword && newPassword) {
                const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
                
                if (!isPasswordValid) {
                    await transaction.rollback();
                    return this.handleError(req, res, 401, "Current password is incorrect");
                }
                
                updateData.password = await bcrypt.hash(newPassword, 10);
            }
            
            // Update user if there are changes
            if (Object.keys(updateData).length > 0) {
                await user.update(updateData, { transaction });
                await transaction.commit();
                
                return this.handleSuccess(req, res, 200, { 
                    message: "User account updated successfully" 
                });
            } else {
                await transaction.rollback();
                return this.handleError(req, res, 400, "No changes were provided");
            }
        } catch (error) {
            await transaction.rollback();
            console.error("Error updating user account:", error);
            return this.handleError(req, res, 500, "Failed to update user account");
        }
    }
    
    /**
     * Delete user account
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async deleteUserAccount(req, res) {
        const transaction = await sequelize.transaction();
        
        try {
            const userId = req.userId;
            const { password } = req.body;
            
            const validation = this.validateRequiredFields(req.body, ['password']);
            if (!validation.isValid) {
                await transaction.rollback();
                return this.handleError(req, res, 400, "Password is required");
            }
            
            const user = await User.findByPk(userId);
            if (!user) {
                await transaction.rollback();
                return this.handleError(req, res, 404, "User not found");
            }
            
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                await transaction.rollback();
                return this.handleError(req, res, 401, "Password is incorrect");
            }
            
            // Delete user (this should cascade to associated records based on db foreign keys)
            await user.destroy({ transaction });
            
            await transaction.commit();
            return this.handleSuccess(req, res, 200, { 
                message: "Account deleted successfully" 
            });
        } catch (error) {
            await transaction.rollback();
            console.error("Error deleting user account:", error);
            return this.handleError(req, res, 500, "Failed to delete user account");
        }
    }
}

// Create a singleton instance
const userController = new UserController();

// Export the instance
module.exports = userController;
