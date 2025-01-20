const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const Profile = sequelize.define(
	"Profile",
	{
		profile_id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
			allowNull: false,
		},
		user_id: {
			type: DataTypes.INTEGER,
		},
		age: {
			type: DataTypes.INTEGER,
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		photo_path: {
			type: DataTypes.STRING,
		},
		child_profile: {
			type: DataTypes.BOOLEAN,
		},
		date_of_birth: {
			type: DataTypes.DATE,
		},
		language: {
			type: DataTypes.STRING,
		},
	},
	{
		timestamps: false,
		tableName: "Profiles",
	}
);

module.exports = Profile;
