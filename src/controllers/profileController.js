const BaseController = require('./BaseController');
const { profileService } = require('../services');
const { Profile } = require('../models/Profile');

/**
 * Controller for handling profile-related operations
 * Uses profileService for business logic
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
            
            const profiles = await profileService.getUserProfiles(userId);
            
            if (!profiles.length) {
                return this.handleSuccess(req, res, 200, { 
                    message: "No profiles found for this user.",
                    profiles: []
                });
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
            const userId = req.userId; // From auth middleware
            
            if (!profileId) {
                return this.handleError(req, res, 400, "Profile ID is required");
            }
            
            const profile = await Profile.findByPk(profileId);
            
            if (!profile) {
                return this.handleError(req, res, 404, "Profile not found");
            }
            
            // Check if the profile belongs to the authenticated user
            if (profile.user_id !== userId) {
                return this.handleError(req, res, 403, "You don't have permission to access this profile");
            }
            
            return this.handleSuccess(req, res, 200, { profile });
        } catch (error) {
            console.error(error);
            if (error.name === 'SequelizeDatabaseError' && error.message.includes('invalid input syntax')) {
                return this.handleError(req, res, 400, "Invalid profile ID format");
            }
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
            
            // Check if required fields are present
            const requiredFields = ['name', 'age'];
            const missingFields = requiredFields.filter(field => !profileData[field]);
            
            if (missingFields.length > 0) {
                return this.handleError(req, res, 400, `Missing required fields: ${missingFields.join(', ')}`);
            }
            
            // Check if user has reached maximum profile limit (e.g., 5 profiles)
            const existingProfiles = await profileService.getUserProfiles(userId);
            if (existingProfiles.length >= 5) {
                return this.handleError(req, res, 403, "Maximum profile limit reached (5 profiles)");
            }
            
            const profile = await profileService.createProfile(userId, profileData);
            
            return this.handleSuccess(req, res, 201, { profile });
        } catch (error) {
            console.error(error);
            if (error.name === 'SequelizeUniqueConstraintError') {
                return this.handleError(req, res, 409, "A profile with this name already exists for this user");
            }
            if (error.name === 'SequelizeValidationError') {
                return this.handleError(req, res, 422, "Invalid profile data provided", error.message);
            }
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
            const userId = req.userId; // From auth middleware
            const profileData = req.body;
            
            if (!profileId) {
                return this.handleError(req, res, 400, "Profile ID is required");
            }
            
            // Check if the profile exists and belongs to the user
            const profile = await Profile.findByPk(profileId);
            
            if (!profile) {
                return this.handleError(req, res, 404, "Profile not found");
            }
            
            if (profile.user_id !== userId) {
                return this.handleError(req, res, 403, "You don't have permission to update this profile");
            }
            
            const updatedProfile = await profileService.updateProfile(profileId, profileData);
            
            return this.handleSuccess(req, res, 200, { profile: updatedProfile });
        } catch (error) {
            console.error(error);
            if (error.name === 'SequelizeUniqueConstraintError') {
                return this.handleError(req, res, 409, "A profile with this name already exists for this user");
            }
            if (error.name === 'SequelizeValidationError') {
                return this.handleError(req, res, 422, "Invalid profile data provided", error.message);
            }
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
            const userId = req.userId; // From auth middleware
            
            if (!profileId) {
                return this.handleError(req, res, 400, "Profile ID is required");
            }
            
            // Check if the profile exists and belongs to the user
            const profile = await Profile.findByPk(profileId);
            
            if (!profile) {
                return this.handleError(req, res, 404, "Profile not found");
            }
            
            if (profile.user_id !== userId) {
                return this.handleError(req, res, 403, "You don't have permission to delete this profile");
            }
            
            const result = await profileService.deleteProfile(profileId);
            
            return this.handleSuccess(req, res, 204, { message: "Profile deleted successfully" });
        } catch (error) {
            console.error(error);
            if (error.message && error.message.includes('foreign key constraint')) {
                return this.handleError(req, res, 409, "Cannot delete profile as it has associated data");
            }
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
            const userId = req.userId; // From auth middleware
            const limit = req.query.limit ? parseInt(req.query.limit) : 20;
            
            if (!profileId) {
                return this.handleError(req, res, 400, "Profile ID is required");
            }
            
            // Check if the profile exists and belongs to the user
            const profile = await Profile.findByPk(profileId);
            
            if (!profile) {
                return this.handleError(req, res, 404, "Profile not found");
            }
            
            if (profile.user_id !== userId) {
                return this.handleError(req, res, 403, "You don't have permission to access this profile's content");
            }
            
            const content = await profileService.getAgeAppropriateContent(profileId, limit);
            
            return this.handleSuccess(req, res, 200, { content });
        } catch (error) {
            console.error(error);
            if (error.name === 'SequelizeDatabaseError') {
                return this.handleError(req, res, 400, "Invalid request parameters", error.message);
            }
            return this.handleError(req, res, 500, "Error retrieving content", error.message);
        }
    }
}

// Create a singleton instance
const profileController = new ProfileController();

// Export the instance
module.exports = profileController;
