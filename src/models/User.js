const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const User = sequelize.define(
	"User",
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
			defaultValue: "not_activated",
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
	}
);

module.exports = User;
