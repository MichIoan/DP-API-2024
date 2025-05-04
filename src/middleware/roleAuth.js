/**
 * Role-based authentication middleware
 * Checks if the authenticated user has the required role to access a resource
 */
const UserRole = require('../models/enums/UserRole');
const { User } = require('../models/User');

/**
 * Middleware to check if user has required role
 * @param {string|Array} requiredRoles - Required role(s) to access the resource
 * @returns {Function} Express middleware function
 */
function roleAuth(requiredRoles) {
    // Convert single role to array for consistent handling
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    return async (req, res, next) => {
        try {
            // User ID should be set by isLoggedIn middleware
            const userId = req.userId;
            
            if (!userId) {
                return res.response(req, res, 401, {
                    success: false,
                    error: 'Authentication required'
                });
            }
            
            // Get user from database to check role
            const user = await User.findByPk(userId);
            
            if (!user) {
                return res.response(req, res, 401, {
                    success: false,
                    error: 'User not found'
                });
            }
            
            // Check if user has any of the required roles
            const hasPermission = roles.some(role => 
                UserRole.hasPermission(user.role, role)
            );
            
            if (!hasPermission) {
                return res.response(req, res, 403, {
                    success: false,
                    error: 'Insufficient permissions to access this resource'
                });
            }
            
            // Add user role to request for further use
            req.userRole = user.role;
            
            // User has required role, proceed to next middleware
            next();
        } catch (error) {
            console.error('Role authentication error:', error);
            return res.response(req, res, 500, {
                success: false,
                error: 'Internal server error during role verification'
            });
        }
    };
}

// Convenience middleware for common role checks
roleAuth.isAdmin = roleAuth(UserRole.ADMIN);
roleAuth.isModerator = roleAuth([UserRole.ADMIN, UserRole.MODERATOR]);
roleAuth.isUser = roleAuth([UserRole.ADMIN, UserRole.MODERATOR, UserRole.USER]);

module.exports = roleAuth;
