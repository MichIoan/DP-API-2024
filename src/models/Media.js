const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const Media = sequelize.define(
	"Media",
	{
		media_id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
			allowNull: false,
		},
		season_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		episode_number: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		title: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		duration: {
			type: DataTypes.TIME,
			allowNull: false,
		},
		release_date: {
			type: DataTypes.DATE,
		},
	},
	{
		timestamps: false,
		tableName: "Media",
	}
);

module.exports = Media;
