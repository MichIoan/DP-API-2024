const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");
const BaseModel = require("./BaseModel");

/**
 * Season model represents a season of a TV series
 * Contains information about the season and its metadata
 */
class Season extends BaseModel {
    /**
     * Check if this is the latest season
     * @param {number} totalSeasons - Total number of seasons in the series
     * @returns {boolean} True if this is the latest season
     */
    isLatestSeason(totalSeasons) {
        return this.season_number === totalSeasons;
    }
    
    /**
     * Check if this season was released recently (within last 90 days)
     * @returns {boolean} True if recently released
     */
    isRecentlyReleased() {
        if (!this.release_date) return false;
        
        const releaseDate = new Date(this.release_date);
        const now = new Date();
        const diffTime = Math.abs(now - releaseDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays <= 90;
    }
    
    /**
     * Format season data for XML responses
     * @returns {Object} Season data formatted for XML
     */
    toXML() {
        const data = this.get();
        return {
            season: {
                id: data.season_id,
                seriesId: data.series_id,
                seasonNumber: data.season_number,
                releaseDate: data.release_date,
                episodeCount: data.episode_count,
                description: data.description
            }
        };
    }
}

Season.initialize(
    {
        season_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        series_id: {
            type: DataTypes.INTEGER,
        },
        season_number: {
            type: DataTypes.INTEGER,
        },
        release_date: {
            type: DataTypes.DATE,
        },
        episode_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    },
    {
        tableName: "seasons",
        timestamps: false,
    },
    sequelize
);

module.exports = Season;
