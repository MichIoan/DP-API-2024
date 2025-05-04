const BaseController = require('./BaseController');
const { userService } = require('../services');

/**
 * Controller for handling authentication operations
 * Extends BaseController to inherit common functionality
 * Implements role-based access control and token refresh
 */
class AuthController extends BaseController {
    /**
     * Register a new user
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async register(req, res) {
        try {
            const { email, password, referral_code } = req.body;

            const validation = this.validateRequiredFields(req.body, ['email', 'password']);
            if (!validation.isValid) {
                return this.handleError(req, res, 400, "Email and password are required.");
            }

            if (!this.isValidEmail(email)) {
                return this.handleError(req, res, 422, "Invalid email format.");
            }

            const userData = {
                email,
                password,
                referral_code: referral_code || null,
                first_name: req.body.first_name || null,
                last_name: req.body.last_name || null
            };

            await userService.registerUser(userData);

            return this.handleSuccess(req, res, 201, {
                message: "User was created successfully."
            });
        } catch (error) {
            console.error("Error during registration:", error);
            
            if (error.message === 'Email already in use') {
                return this.handleError(req, res, 409, "User with this email already exists.");
            }
            
            if (error.name === 'SequelizeValidationError') {
                return this.handleError(req, res, 422, "Invalid user data provided.", error.message);
            }
            
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }

    /**
     * Login a user
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async login(req, res) {
        try {
            const { email, password } = req.body;

            const validation = this.validateRequiredFields(req.body, ['email', 'password']);
            if (!validation.isValid) {
                return this.handleError(req, res, 400, "Email and password are required.");
            }

            if (!this.isValidEmail(email)) {
                return this.handleError(req, res, 422, "Invalid email format.");
            }

            try {
                const result = await userService.loginUser(email, password, req);
                
                return this.handleSuccess(req, res, 200, result);
            } catch (error) {
                // Handle specific login errors
                if (error.message === 'Invalid email or password' || error.message === 'Account is not active') {
                    return this.handleError(req, res, 401, error.message);
                }
                
                throw error; // Re-throw for general error handling
            }
        } catch (error) {
            console.error("Error during login:", error);
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} - True if email is valid
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Refresh access token using refresh token
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            
            if (!refreshToken) {
                return this.handleError(req, res, 400, "Refresh token is required.");
            }
            
            const result = await userService.refreshToken(refreshToken, req);
            
            return this.handleSuccess(req, res, 200, result);
        } catch (error) {
            console.error("Error refreshing token:", error);
            
            if (error.message.includes('refresh token')) {
                return this.handleError(req, res, 401, error.message);
            }
            
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }

    /**
     * Logout user by revoking refresh tokens
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async logout(req, res) {
        try {
            const userId = req.userId; // Set by isLoggedIn middleware
            
            if (!userId) {
                return this.handleError(req, res, 401, "Authentication required.");
            }
            
            // Revoke all refresh tokens for the user
            const tokensRevoked = await userService.revokeAllTokens(userId);
            
            return this.handleSuccess(req, res, 200, { 
                message: "Logged out successfully",
                tokensRevoked
            });
        } catch (error) {
            console.error("Error during logout:", error);
            return this.handleError(req, res, 500, "Internal server error", error.message);
        }
    }
}

// Create a singleton instance
const authController = new AuthController();

// Export the instance
module.exports = authController;
