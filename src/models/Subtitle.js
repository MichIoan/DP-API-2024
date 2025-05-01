const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");
const BaseModel = require("./BaseModel");

/**
 * Subtitle model represents subtitle files for media content
 * Each media can have multiple subtitles in different languages
 */
class Subtitle extends BaseModel {
    /**
     * Get the file extension of the subtitle file
     * @returns {string} File extension
     */
    getFileExtension() {
        if (!this.file_path) return '';
        const parts = this.file_path.split('.');
        return parts.length > 1 ? parts[parts.length - 1] : '';
    }
    
    /**
     * Check if subtitle is in a specific language
     * @param {string} lang - Language code to check
     * @returns {boolean} True if subtitle is in the specified language
     */
    isLanguage(lang) {
        return this.language === lang;
    }
    
    /**
     * Format subtitle data for XML responses
     * @returns {Object} Subtitle data formatted for XML
     */
    toXML() {
        const data = this.get();
        return {
            subtitle: {
                id: data.subtitles_id,
                mediaId: data.media_id,
                language: data.language,
                filePath: data.file_path
            }
        };
    }
}

Subtitle.initialize(
    {
        subtitles_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        media_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'media',
                key: 'media_id'
            }
        },
        language: {
            type: DataTypes.STRING(10),
            allowNull: false,
            defaultValue: 'en'
        },
        file_path: {
            type: DataTypes.STRING(255),
            allowNull: false
        }
    },
    {
        tableName: "subtitles",
        timestamps: false,
    },
    sequelize
);

module.exports = Subtitle;
