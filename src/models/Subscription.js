const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const Subscription = sequelize.define(
	"Subscription",
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
		},
		status: {
			type: DataTypes.STRING,
			allowNull: false,
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
	}
);

module.exports = Subscription;
