const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const Season = sequelize.define(
	"Season",
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
	},
	{
		timestamps: false,
	}
);

module.exports = Season;
