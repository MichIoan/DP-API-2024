const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");
const BaseModel = require("./BaseModel");
const ContentClassification = require("./enums/ContentClassification");

/**
 * ViewingClassification model represents content rating classifications
 * Used for age-appropriate content filtering
 */
class ViewingClassification extends BaseModel {
    /**
     * Check if content is suitable for children
     * @returns {boolean} True if suitable for children
     */
    isSuitableForChildren() {
        return this.classification === ContentClassification.G || 
               this.classification === ContentClassification.PG;
    }
    
    /**
     * Get minimum age recommendation for this classification
     * @returns {number} Minimum recommended age
     */
    getMinimumAge() {
        switch (this.classification) {
            case ContentClassification.G:
                return 0;
            case ContentClassification.PG:
                return 7;
            case ContentClassification.PG13:
                return 13;
            case ContentClassification.R:
                return 17;
            case ContentClassification.NC17:
                return 18;
            default:
                return 13;
        }
    }
    
    /**
     * Format classification data for XML responses
     * @returns {Object} Classification data formatted for XML
     */
    toXML() {
        const data = this.get();
        return {
            classification: {
                id: data.viewing_classification_id,
                code: data.classification,
                description: data.description,
                minimumAge: this.getMinimumAge()
            }
        };
    }
}

ViewingClassification.initialize(
    {
        viewing_classification_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        classification: {
            type: DataTypes.STRING(10),
            allowNull: false,
            validate: {
                isIn: {
                    args: [ContentClassification.getAllValues()],
                    msg: "Invalid content classification"
                }
            }
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    },
    {
        tableName: "viewing_classifications",
        timestamps: false,
    },
    sequelize
);

module.exports = ViewingClassification;
