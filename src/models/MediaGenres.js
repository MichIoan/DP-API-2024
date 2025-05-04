const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");
const BaseModel = require("./BaseModel");

/**
 * MediaGenres model represents the many-to-many relationship
 * between Media and Genres in the Netflix application
 */
class MediaGenres extends BaseModel {
    /**
     * Format media genre data for XML responses
     * @returns {Object} Media genre data formatted for XML
     */
    toXML() {
        const data = this.get();
        return {
            mediaGenre: {
                id: data.media_genre_id,
                mediaId: data.media_id,
                genreId: data.genre_id
            }
        };
    }
}

MediaGenres.initialize(
    {
        media_genre_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
        },
        media_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'media',
                key: 'media_id'
            }
        },
        genre_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'genres',
                key: 'genre_id'
            }
        }
    },
    {
        tableName: "media_genres",
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ['media_id', 'genre_id']
            }
        ]
    },
    sequelize
);

module.exports = MediaGenres;
