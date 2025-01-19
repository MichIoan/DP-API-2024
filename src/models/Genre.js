const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const Genre = sequelize.define(
	"Genre",
	{
		genre_id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
			allowNull: false,
		},
		preferences_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		genre_type: {
			type: DataTypes.STRING,
			allowNull: false,
		},
	},
	{
		timestamps: false,
		tableName: "Genre",
	}
);

module.exports = Genre;
