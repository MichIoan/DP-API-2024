const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");
const BaseModel = require("./BaseModel");
const ContentClassification = require("./enums/ContentClassification");

/**
 * Series model represents TV series in the Netflix application
 * Contains information about the series and its metadata
 */
class Series extends BaseModel {
    /**
     * Check if series is suitable for children
     * @returns {boolean} True if suitable for children
     */
    isSuitableForChildren() {
        return this.age_restriction <= 13;
    }
    
    /**
     * Get appropriate content classification based on age restriction
     * @returns {string} Content classification code
     */
    getContentClassification() {
        if (this.age_restriction <= 7) {
            return ContentClassification.G;
        } else if (this.age_restriction <= 13) {
            return ContentClassification.PG;
        } else if (this.age_restriction <= 17) {
            return ContentClassification.PG13;
        } else {
            return ContentClassification.R;
        }
    }
    
    /**
     * Check if series is currently running
     * @returns {boolean} True if series is still running
     */
    isRunning() {
        return !this.end_date || new Date(this.end_date) > new Date();
    }
    
    /**
     * Format series data for XML responses
     * @returns {Object} Series data formatted for XML
     */
    toXML() {
        const data = this.get();
        return {
            series: {
                id: data.series_id,
                title: data.title,
                ageRestriction: data.age_restriction,
                startDate: data.start_date,
                endDate: data.end_date,
                description: data.description,
                rating: data.rating
            }
        };
    }
}

Series.initialize(
    {
        series_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        age_restriction: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        start_date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        end_date: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        rating: {
            type: DataTypes.FLOAT,
            allowNull: true,
            validate: {
                min: 0,
                max: 10
            }
        }
    },
    {
        tableName: "series",
        timestamps: false,
    },
    sequelize
);

module.exports = Series;
