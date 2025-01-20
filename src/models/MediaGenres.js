const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");
const Media = require("./Media");
const Genre = require("./Genre");

const MediaGenres = sequelize.define(
	"MediaGenres",
	{
		media_id: {
			type: DataTypes.INTEGER,
			references: {
				model: Media,
				key: "id",
			},
		},
		genre_id: {
			type: DataTypes.INTEGER,
			references: {
				model: Genre,
				key: "id",
			},
		},
	},
	{
		timestamps: false,
		tableName: "MediaGenres_Junction",
	}
);

module.exports = MediaGenres;
