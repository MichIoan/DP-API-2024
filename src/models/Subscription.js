const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");
const BaseModel = require("./BaseModel");
const SubscriptionType = require("./enums/SubscriptionType");

/**
 * Enum for subscription status
 */
class SubscriptionStatus {
    static ACTIVE = 'active';
    static CANCELED = 'canceled';
    static EXPIRED = 'expired';
    static TRIAL = 'trial';
    
    static getAllValues() {
        return [this.ACTIVE, this.CANCELED, this.EXPIRED, this.TRIAL];
    }
}

class Subscription extends BaseModel {
    /**
     * Check if subscription is active
     * @returns {boolean} True if subscription is active
     */
    isActive() {
        const now = new Date();
        return this.status === SubscriptionStatus.ACTIVE && 
            this.end_date && 
            now < this.end_date;
    }
    
    /**
     * Check if subscription is in trial period
     * @returns {boolean} True if subscription is in trial
     */
    isTrial() {
        return this.status === SubscriptionStatus.TRIAL;
    }
    
    /**
     * Get days remaining in subscription
     * @returns {number} Days remaining or 0 if expired
     */
    daysRemaining() {
        if (!this.end_date) return 0;
        
        const now = new Date();
        if (now > this.end_date) return 0;
        
        const diffTime = Math.abs(this.end_date - now);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    /**
     * Calculate price based on subscription type
     * @returns {number} Subscription price
     */
    calculatePrice() {
        return SubscriptionType.getPrice(this.type);
    }
}

Subscription.initialize(
	{
		subscription_id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		user_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		price: {
			type: DataTypes.FLOAT,
		},
		type: {
			type: DataTypes.STRING,
            validate: {
                isIn: {
                    args: [SubscriptionType.getAllValues()],
                    msg: "Invalid subscription type"
                }
            }
		},
		status: {
			type: DataTypes.STRING,
			allowNull: false,
            validate: {
                isIn: {
                    args: [SubscriptionStatus.getAllValues()],
                    msg: "Invalid subscription status"
                }
            }
		},
		start_date: {
			type: DataTypes.DATE,
		},
		end_date: {
			type: DataTypes.DATE,
		},
		description: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
	},
	{
		timestamps: false,
		tableName: "Subscriptions",
	},
    sequelize
);

module.exports = { Subscription, SubscriptionStatus };
