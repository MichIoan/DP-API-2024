const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");
const BaseModel = require("./BaseModel");
const ContentClassification = require("./enums/ContentClassification");

/**
 * Media model represents episodes of series in the Netflix application
 * Each media item belongs to a season and has episode information
 */
class Media extends BaseModel {
    /**
     * Get the duration in minutes
     * @returns {number} Duration in minutes
     */
    getDurationMinutes() {
        if (!this.duration) return 0;
        
        // Parse the time string (HH:MM:SS)
        const parts = this.duration.split(':');
        if (parts.length === 3) {
            const hours = parseInt(parts[0], 10);
            const minutes = parseInt(parts[1], 10);
            return (hours * 60) + minutes;
        }
        return 0;
    }
    
    /**
     * Check if this media is newly released (within last 30 days)
     * @returns {boolean} True if media is new
     */
    isNewRelease() {
        if (!this.release_date) return false;
        
        const releaseDate = new Date(this.release_date);
        const now = new Date();
        const diffTime = Math.abs(now - releaseDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays <= 30;
    }
    
    /**
     * Format media data for XML responses
     * @returns {Object} Media data formatted for XML
     */
    toXML() {
        const data = this.get();
        return {
            episode: {
                id: data.media_id,
                title: data.title,
                seasonId: data.season_id,
                episodeNumber: data.episode_number,
                duration: data.duration,
                releaseDate: data.release_date,
                description: data.description,
                classification: data.classification
            }
        };
    }
}

Media.initialize(
    {
        media_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        season_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        episode_number: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        duration: {
            type: DataTypes.TIME,
            allowNull: false,
        },
        release_date: {
            type: DataTypes.DATE,
        },
        description: {
            type: DataTypes.TEXT,
        },
        classification: {
            type: DataTypes.STRING,
            defaultValue: ContentClassification.PG13,
            validate: {
                isIn: {
                    args: [ContentClassification.getAllValues()],
                    msg: "Invalid content classification"
                }
            }
        }
    },
    {
        tableName: "media",
        timestamps: false,
    },
    sequelize
);

module.exports = Media;
