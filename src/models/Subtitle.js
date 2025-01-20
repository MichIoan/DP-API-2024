const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const Subtitle = sequelize.define(
	"Subtitle",
	{
		subtitles_id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
			allowNull: false,
		},
		media_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
	},
	{
		timestamps: false,
	}
);

module.exports = Subtitle;
