const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const WatchList = sequelize.define(
	"WatchList",
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
		},
	},
	{
		timestamps: false,
		tableName: "WatchLists",
	}
);

module.exports = WatchList;
