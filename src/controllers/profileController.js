const BaseController = require('./BaseController');
const { ProfileService } = require('../services');
const { Profile } = require('../models/Profile');
const User = require('../models/User');

/**
 * Controller for handling profile-related operations
 * Uses ProfileService for business logic
 */
class ProfileController extends BaseController {
    /**
     * Get all profiles for a user
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getUserProfiles(req, res) {
        try {
            const userId = req.userId; // From auth middleware
            
            const profiles = await ProfileService.getUserProfiles(userId);
            
            if (!profiles.length) {
                return this.handleError(req, res, 404, "No profiles found for this user.");
            }
            
            return this.handleSuccess(req, res, 200, { profiles });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Error retrieving profiles", error.message);
        }
    }
    
    /**
     * Get a profile by ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getProfileById(req, res) {
        try {
            const { profileId } = req.params;
            
            const profile = await Profile.findByPk(profileId);
            
            if (!profile) {
                return this.handleError(req, res, 404, "Profile not found");
            }
            
            // Check if profile belongs to the authenticated user
            if (profile.user_id !== req.userId) {
                return this.handleError(req, res, 403, "You don't have permission to access this profile");
            }
            
            return this.handleSuccess(req, res, 200, { profile });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Error retrieving profile", error.message);
        }
    }
    
    /**
     * Create a new profile
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async createProfile(req, res) {
        try {
            const userId = req.userId; // From auth middleware
            const profileData = req.body;
            
            // Validate required fields
            const { isValid, missingFields } = this.validateRequiredFields(profileData, ['name']);
            
            if (!isValid) {
                return this.handleError(req, res, 400, `Missing required fields: ${missingFields.join(', ')}`);
            }
            
            const profile = await ProfileService.createProfile(userId, profileData);
            
            return this.handleSuccess(req, res, 201, { profile });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Error creating profile", error.message);
        }
    }
    
    /**
     * Update a profile
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async updateProfile(req, res) {
        try {
            const { profileId } = req.params;
            const profileData = req.body;
            
            // Find profile to check ownership
            const profile = await Profile.findByPk(profileId);
            
            if (!profile) {
                return this.handleError(req, res, 404, "Profile not found");
            }
            
            // Check if profile belongs to the authenticated user
            if (profile.user_id !== req.userId) {
                return this.handleError(req, res, 403, "You don't have permission to update this profile");
            }
            
            const updatedProfile = await ProfileService.updateProfile(profileId, profileData);
            
            return this.handleSuccess(req, res, 200, { profile: updatedProfile });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Error updating profile", error.message);
        }
    }
    
    /**
     * Delete a profile
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async deleteProfile(req, res) {
        try {
            const { profileId } = req.params;
            
            // Find profile to check ownership
            const profile = await Profile.findByPk(profileId);
            
            if (!profile) {
                return this.handleError(req, res, 404, "Profile not found");
            }
            
            // Check if profile belongs to the authenticated user
            if (profile.user_id !== req.userId) {
                return this.handleError(req, res, 403, "You don't have permission to delete this profile");
            }
            
            const result = await ProfileService.deleteProfile(profileId);
            
            return this.handleSuccess(req, res, 200, { message: "Profile deleted successfully" });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Error deleting profile", error.message);
        }
    }
    
    /**
     * Get age-appropriate content for a profile
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getAgeAppropriateContent(req, res) {
        try {
            const { profileId } = req.params;
            const limit = req.query.limit ? parseInt(req.query.limit) : 20;
            
            // Find profile to check ownership
            const profile = await Profile.findByPk(profileId);
            
            if (!profile) {
                return this.handleError(req, res, 404, "Profile not found");
            }
            
            // Check if profile belongs to the authenticated user
            if (profile.user_id !== req.userId) {
                return this.handleError(req, res, 403, "You don't have permission to access this profile's content");
            }
            
            const content = await ProfileService.getAgeAppropriateContent(profileId, limit);
            
            return this.handleSuccess(req, res, 200, { content });
        } catch (error) {
            console.error(error);
            return this.handleError(req, res, 500, "Error getting age-appropriate content", error.message);
        }
    }
}

// Create a singleton instance
const profileController = new ProfileController();

// Export the instance
module.exports = profileController;
