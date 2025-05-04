const express = require("express");
const router = express.Router();
const isLoggedIn = require("../middleware/isLoggedIn");
const roleAuth = require("../middleware/roleAuth");
const validate = require("../middleware/validate");
const { updateUserRoleSchema } = require("../validation/adminValidation");
const UserRole = require("../models/enums/UserRole");
const { User } = require("../models/User");
const BaseController = require("../controllers/BaseController");
const sequelize = require("../config/sequelize");

/**
 * Admin controller for handling administrative operations
 * Demonstrates role-based access control
 */
class AdminController extends BaseController {
    /**
     * Get all users (admin only)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getAllUsers(req, res) {
        try {
            const users = await User.findAll({
                attributes: ['user_id', 'email', 'role', 'activation_status', 'created_at']
            });
            
            return this.handleSuccess(req, res, 200, { users });
        } catch (error) {
            console.error('Error getting users:', error);
            return this.handleError(req, res, 500, "Error retrieving users", error.message);
        }
    }
    
    /**
     * Update user role (admin only)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async updateUserRole(req, res) {
        try {
            const { userId } = req.params;
            const { role } = req.body;
            
            if (!userId || !role) {
                return this.handleError(req, res, 400, "User ID and role are required");
            }
            
            if (!UserRole.isValid(role)) {
                return this.handleError(req, res, 400, "Invalid role");
            }
            
            const user = await User.findByPk(userId);
            
            if (!user) {
                return this.handleError(req, res, 404, "User not found");
            }
            
            await user.update({ role });
            
            return this.handleSuccess(req, res, 200, {
                message: "User role updated successfully",
                user: {
                    user_id: user.user_id,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('Error updating user role:', error);
            return this.handleError(req, res, 500, "Error updating user role", error.message);
        }
    }
    
    /**
     * Get system statistics (moderator+ only)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getSystemStats(req, res) {
        try {
            // Count users by role
            const usersByRole = await User.findAll({
                attributes: ['role', [sequelize.fn('COUNT', sequelize.col('user_id')), 'count']],
                group: ['role']
            });
            
            // Count users by status
            const usersByStatus = await User.findAll({
                attributes: ['activation_status', [sequelize.fn('COUNT', sequelize.col('user_id')), 'count']],
                group: ['activation_status']
            });
            
            // Total users
            const totalUsers = await User.count();
            
            return this.handleSuccess(req, res, 200, {
                totalUsers,
                usersByRole,
                usersByStatus
            });
        } catch (error) {
            console.error('Error getting system stats:', error);
            return this.handleError(req, res, 500, "Error retrieving system statistics", error.message);
        }
    }
}

// Create singleton instance
const adminController = new AdminController();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Administrative operations (restricted access)
 */

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *       403:
 *         description: Insufficient permissions
 *       401:
 *         description: Unauthorized
 */
router.get("/users", isLoggedIn, roleAuth.isAdmin, adminController.getAllUsers);

/**
 * @swagger
 * /admin/users/{userId}/role:
 *   put:
 *     summary: Update user role (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, moderator, user]
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 */
router.put("/users/:userId/role", isLoggedIn, roleAuth.isAdmin, validate(updateUserRoleSchema), adminController.updateUserRole);

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Get system statistics (moderator+ only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System statistics
 *       403:
 *         description: Insufficient permissions
 *       401:
 *         description: Unauthorized
 */
router.get("/stats", isLoggedIn, roleAuth.isModerator, adminController.getSystemStats);

module.exports = router;
