const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");
const BaseModel = require("./BaseModel");
const ContentClassification = require("./enums/ContentClassification");

/**
 * Profile model represents a user profile in the Netflix application
 * Each user can have multiple profiles with different settings
 */
class Profile extends BaseModel {
    /**
     * Check if profile is for a child
     * @returns {boolean} True if this is a child profile
     */
    isChildProfile() {
        return this.child_profile === true;
    }
    
    /**
     * Get age-appropriate content classification for this profile
     * @returns {string} Content classification code
     */
    getContentClassification() {
        if (this.age < 7) {
            return ContentClassification.G;
        } else if (this.age < 13) {
            return ContentClassification.PG;
        } else if (this.age < 17) {
            return ContentClassification.PG13;
        } else {
            return ContentClassification.R;
        }
    }
    
    /**
     * Format profile data for XML responses
     * @returns {Object} Profile data formatted for XML
     */
    toXML() {
        const data = this.get();
        return {
            profile: {
                id: data.profile_id,
                name: data.name,
                age: data.age,
                isChild: data.child_profile,
                language: data.language,
                dateOfBirth: data.date_of_birth
            }
        };
    }
}

Profile.initialize(
    {
        profile_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        user_id: {
            type: DataTypes.INTEGER,
        },
        age: {
            type: DataTypes.INTEGER,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        photo_path: {
            type: DataTypes.STRING,
        },
        child_profile: {
            type: DataTypes.BOOLEAN,
        },
        date_of_birth: {
            type: DataTypes.DATE,
        },
        language: {
            type: DataTypes.STRING,
        },
    },
    {
        tableName: "profiles",
        timestamps: false,
    },
    sequelize
);

module.exports = Profile;
