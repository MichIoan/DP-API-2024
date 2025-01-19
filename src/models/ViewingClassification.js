const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const ViewingClassification = sequelize.define(
	"ViewingClassification",
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
			allowNull: false,
		},
		type: {
			type: DataTypes.STRING,
			allowNull: false,
		},
	},
	{
		timestamps: false,
		tableName: "ViewingClassification",
	}
);

module.exports = ViewingClassification;
