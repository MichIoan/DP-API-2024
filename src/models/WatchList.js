const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");
const BaseModel = require("./BaseModel");
const { ViewingStatus } = require("./WatchHistory");

/**
 * WatchList model represents items a user wants to watch later
 * Tracks content added to a user's watchlist for future viewing
 */
class WatchList extends BaseModel {
    /**
     * Check if this item is ready to watch (not started yet)
     * @returns {boolean} True if ready to watch
     */
    isReadyToWatch() {
        return !this.viewing_status || this.viewing_status === ViewingStatus.STARTED;
    }
    
    /**
     * Check if this item was added recently (within last 30 days)
     * @returns {boolean} True if recently added
     */
    isRecentlyAdded() {
        if (!this.date_added) return false;
        
        const addedDate = new Date(this.date_added);
        const now = new Date();
        const diffTime = Math.abs(now - addedDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays <= 30;
    }
    
    /**
     * Format watchlist data for XML responses
     * @returns {Object} Watchlist data formatted for XML
     */
    toXML() {
        const data = this.get();
        return {
            watchlistItem: {
                id: data.list_id,
                profileId: data.profile_id,
                mediaId: data.media_id,
                viewingStatus: data.viewing_status,
                dateAdded: data.date_added,
                priority: data.priority
            }
        };
    }
}

WatchList.initialize(
    {
        list_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        profile_id: {
            type: DataTypes.INTEGER,
        },
        media_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        viewing_status: {
            type: DataTypes.STRING,
            defaultValue: ViewingStatus.STARTED,
            validate: {
                isIn: {
                    args: [ViewingStatus.getAllValues()],
                    msg: "Invalid viewing status"
                }
            }
        },
        date_added: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        priority: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: {
                min: 0,
                max: 10
            }
        }
    },
    {
        tableName: "watch_lists",
        timestamps: false,
    },
    sequelize
);

module.exports = WatchList;
