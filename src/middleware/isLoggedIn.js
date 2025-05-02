const { UserService } = require("../services");
const User = require("../models/User");

/**
 * Authentication middleware to verify JWT token
 * Sets req.userId for use in controllers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function isLoggedIn(req, res, next) {
    try {
        // Get token from authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.response(req, res, 401, { 
                error: "Authentication required. Please provide a valid token." 
            });
        }
        
        const token = authHeader.split(' ')[1];
        
        // Verify token
        const decoded = await UserService.verifyToken(token);
        
        // Set userId in request for use in controllers
        req.userId = decoded.id;
        
        // Find user
        const user = await User.findByPk(req.userId);
        
        if (!user) {
            return res.response(req, res, 401, { 
                error: "User not found" 
            });
        }
        
        if (user.status === "DELETED" || user.status === "INACTIVE") {
            return res.response(req, res, 401, { 
                error: "Account is inactive or deleted" 
            });
        }
        
        // User is authenticated, proceed to next middleware
        next();
    } catch (error) {
        console.error("Authentication error:", error);
        
        if (error.name === 'TokenExpiredError') {
            return res.response(req, res, 401, { 
                error: "Token expired. Please log in again." 
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.response(req, res, 401, { 
                error: "Invalid token. Please log in again." 
            });
        }
        
        return res.response(req, res, 500, { 
            error: "Internal server error during authentication" 
        });
    }
}

module.exports = isLoggedIn;
