const BaseController = require('./BaseController');
const { UserService } = require('../services');

/**
 * Controller for handling authentication operations
 * Extends BaseController to inherit common functionality
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
                return this.handleError(req, res, 400, "Invalid email format.");
            }

            const userData = {
                email,
                password,
                referral_code: referral_code || null,
                first_name: req.body.first_name || null,
                last_name: req.body.last_name || null
            };

            await UserService.registerUser(userData);

            return this.handleSuccess(req, res, 201, {
                message: "User was created successfully."
            });
        } catch (error) {
            console.error("Error during registration:", error);
            
            if (error.message === 'Email already in use') {
                return this.handleError(req, res, 400, "User with this email already exists.");
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
                return this.handleError(req, res, 400, "Invalid email format.");
            }

            try {
                const result = await UserService.loginUser(email, password);
                
                return this.handleSuccess(req, res, 200, {
                    message: "Login successful",
                    token: result.token,
                    user: result.user
                });
            } catch (error) {
                // Handle specific login errors
                if (error.message === 'Invalid email or password') {
                    return this.handleError(req, res, 401, error.message);
                } else if (error.message === 'Account is not active') {
                    return this.handleError(req, res, 403, error.message);
                } else if (error.message && error.message.includes('locked')) {
                    return this.handleError(req, res, 403, error.message);
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
     * @returns {boolean} - Whether the email is valid
     * @private
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

// Create a singleton instance
const authController = new AuthController();

// Export the instance
module.exports = authController;
