const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");
const BaseModel = require("./BaseModel");

/**
 * Enum for viewing status
 */
class ViewingStatus {
    static STARTED = 'started';
    static IN_PROGRESS = 'in_progress';
    static COMPLETED = 'completed';
    static ABANDONED = 'abandoned';
    
    static getAllValues() {
        return [this.STARTED, this.IN_PROGRESS, this.COMPLETED, this.ABANDONED];
    }
    
    static isValid(status) {
        return this.getAllValues().includes(status);
    }
}

/**
 * WatchHistory model represents a user's viewing history
 * Tracks what content has been watched, when, and viewing progress
 */
class WatchHistory extends BaseModel {
    /**
     * Check if media has been completed
     * @returns {boolean} True if viewing is complete
     */
    isCompleted() {
        return this.viewing_status === ViewingStatus.COMPLETED;
    }
    
    /**
     * Check if this is a recently watched item (within last 7 days)
     * @returns {boolean} True if recently watched
     */
    isRecentlyWatched() {
        if (!this.time_stamp) return false;
        
        const watchDate = new Date(this.time_stamp);
        const now = new Date();
        const diffTime = Math.abs(now - watchDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays <= 7;
    }
    
    /**
     * Get completion percentage based on resume_to
     * @param {number} totalDuration - Total duration in seconds
     * @returns {number} Percentage completed (0-100)
     */
    getCompletionPercentage(totalDuration) {
        if (!this.resume_to || !totalDuration) return 0;
        
        // Parse the time string (HH:MM:SS)
        const parts = this.resume_to.split(':');
        if (parts.length === 3) {
            const hours = parseInt(parts[0], 10);
            const minutes = parseInt(parts[1], 10);
            const seconds = parseInt(parts[2], 10);
            const resumeToSeconds = (hours * 3600) + (minutes * 60) + seconds;
            
            return Math.min(100, Math.round((resumeToSeconds / totalDuration) * 100));
        }
        return 0;
    }
    
    /**
     * Format watch history data for XML responses
     * @returns {Object} Watch history data formatted for XML
     */
    toXML() {
        const data = this.get();
        return {
            watchHistory: {
                id: data.history_id,
                profileId: data.profile_id,
                mediaId: data.media_id,
                resumeTo: data.resume_to,
                timesWatched: data.times_watched,
                timeStamp: data.time_stamp,
                viewingStatus: data.viewing_status
            }
        };
    }
}

WatchHistory.initialize(
    {
        history_id: {
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
        resume_to: {
            type: DataTypes.TIME,
        },
        times_watched: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        },
        time_stamp: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
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
    },
    {
        tableName: "watch_history",
        timestamps: false,
    },
    sequelize
);

// Export both the model and the enum
module.exports = { 
    WatchHistory,
    ViewingStatus
};
