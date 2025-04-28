const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");
const BaseModel = require("./BaseModel");
const UserStatus = require("./enums/UserStatus");

class User extends BaseModel {
    /**
     * Custom method to check if user account is active
     * @returns {boolean} True if user is active
     */
    isActive() {
        return this.activation_status === UserStatus.ACTIVE;
    }

    /**
     * Custom method to check if user account is locked
     * @returns {boolean} True if user is locked
     */
    isLocked() {
        return this.activation_status === UserStatus.SUSPENDED && 
            this.locked_until && 
            new Date() < this.locked_until;
    }

    /**
     * Custom XML format method
     * @returns {Object} User data in a format suitable for XML conversion
     */
    toXML() {
        const data = this.get();
        // Exclude sensitive fields
        delete data.password;
        
        return { user: data };
    }
}

User.initialize(
	{
		user_id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
			allowNull: false,
		},
		email: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
		},
		password: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		failed_login_attempts: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		activation_status: {
			type: DataTypes.STRING,
			defaultValue: UserStatus.NOT_ACTIVATED,
            validate: {
                isIn: {
                    args: [UserStatus.getAllValues()],
                    msg: "Invalid user status"
                }
            }
		},
		locked_until: {
			type: DataTypes.DATE,
		},
		referral_id: {
			type: DataTypes.INTEGER,
		},
		referral_code: {
			type: DataTypes.STRING,
			unique: true,
		},
		has_discount: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		trial_available: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
		},
	},
	{
		timestamps: false,
	},
    sequelize
);

module.exports = User;
