const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const Series = sequelize.define(
	"Series",
	{
		series_id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
			allowNull: false,
		},
		title: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		age_restriction: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		start_date: {
			type: DataTypes.DATE,
			allowNull: false,
		},
	},
	{
		timestamps: false,
		tableName: "Series",
	}
);

module.exports = Series;
