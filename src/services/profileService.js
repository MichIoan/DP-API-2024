const DbUtils = require('../utils/dbUtils');
const { Profile } = require('../models/Profile');
const ContentClassification = require('../models/enums/ContentClassification');
const sequelize = require('../config/sequelize');

/**
 * Service for handling profile-related operations
 * Uses stored procedures and transactions for data integrity
 */
class ProfileService {
    /**
     * Create a new profile with preferences
     * @param {number} userId - User ID
     * @param {Object} profileData - Profile data
     * @returns {Promise<Object>} - Created profile
     */
    async createProfile(userId, profileData) {
        // Validate content classification
        if (profileData.content_classification && 
            !ContentClassification.isValid(profileData.content_classification)) {
            throw new Error('Invalid content classification');
        }
        
        const transaction = await sequelize.transaction();
        
        try {
            // Call the stored procedure
            const result = await DbUtils.callStoredProcedure(
                'CreateProfileWithPreferences',
                [
                    userId,
                    profileData.name,
                    profileData.age,
                    profileData.content_classification || ContentClassification.GENERAL,
                    profileData.language || 'en',
                    profileData.autoplay || false,
                    profileData.subtitles || false
                ],
                transaction
            );
            
            await transaction.commit();
            return result[0]; // Return the first row which contains the created profile
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    
    /**
     * Get all profiles for a user
     * @param {number} userId - User ID
     * @returns {Promise<Array>} - User profiles
     */
    async getUserProfiles(userId) {
        return Profile.findAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']]
        });
    }
    
    /**
     * Get a profile by ID
     * @param {number} profileId - Profile ID
     * @param {number} userId - User ID (for ownership verification)
     * @returns {Promise<Object>} - Profile
     */
    async getProfileById(profileId, userId) {
        const profile = await Profile.findByPk(profileId);
        
        if (!profile) {
            return null;
        }
        
        // Verify ownership
        if (profile.user_id !== userId) {
            throw new Error('You do not have permission to access this profile');
        }
        
        return profile;
    }
    
    /**
     * Update a profile
     * @param {number} profileId - Profile ID
     * @param {number} userId - User ID (for ownership verification)
     * @param {Object} profileData - Updated profile data
     * @returns {Promise<Object>} - Updated profile
     */
    async updateProfile(profileId, userId, profileData) {
        const transaction = await sequelize.transaction();
        
        try {
            const profile = await Profile.findByPk(profileId, { transaction });
            
            if (!profile) {
                await transaction.rollback();
                return null;
            }
            
            // Verify ownership
            if (profile.user_id !== userId) {
                await transaction.rollback();
                throw new Error('You do not have permission to update this profile');
            }
            
            // Validate content classification if provided
            if (profileData.content_classification && 
                !ContentClassification.isValid(profileData.content_classification)) {
                await transaction.rollback();
                throw new Error('Invalid content classification');
            }
            
            await profile.update(profileData, { transaction });
            
            await transaction.commit();
            return profile;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    
    /**
     * Delete a profile
     * @param {number} profileId - Profile ID
     * @param {number} userId - User ID (for ownership verification)
     * @returns {Promise<boolean>} - Success status
     */
    async deleteProfile(profileId, userId) {
        const transaction = await sequelize.transaction();
        
        try {
            const profile = await Profile.findByPk(profileId, { transaction });
            
            if (!profile) {
                await transaction.rollback();
                return false;
            }
            
            // Verify ownership
            if (profile.user_id !== userId) {
                await transaction.rollback();
                throw new Error('You do not have permission to delete this profile');
            }
            
            await profile.destroy({ transaction });
            
            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    
    /**
     * Get age-appropriate content for a profile
     * @param {number} profileId - Profile ID
     * @param {number} userId - User ID (for ownership verification)
     * @returns {Promise<Array>} - Age-appropriate content
     */
    async getAgeAppropriateContent(profileId, userId) {
        const profile = await this.getProfileById(profileId, userId);
        
        if (!profile) {
            throw new Error('Profile not found');
        }
        
        // Query the age_appropriate_content view
        const query = `
            SELECT * FROM "age_appropriate_content"
            WHERE age_restriction <= :age
            ORDER BY release_date DESC
            LIMIT 50;
        `;
        
        return sequelize.query(query, {
            replacements: { age: profile.age },
            type: sequelize.QueryTypes.SELECT
        });
    }
}

// Create a singleton instance
const profileService = new ProfileService();

// Export the instance
module.exports = profileService;
