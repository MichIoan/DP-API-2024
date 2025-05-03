const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");
const BaseModel = require("./BaseModel");

/**
 * Genre model represents content genres in the Netflix application
 * Used for categorizing content and user preferences
 */
class Genre extends BaseModel {
    /**
     * Get all media with this genre
     * @returns {Promise<Array>} Array of media with this genre
     */
    async getMediaWithGenre() {
        const MediaGenres = require('./MediaGenres');
        const Media = require('./Media');
        
        const mediaGenres = await MediaGenres.findAll({
            where: { genre_id: this.genre_id },
            include: [{ model: Media }]
        });
        
        return mediaGenres.map(mg => mg.Media);
    }
    
    /**
     * Format genre data for XML responses
     * @returns {Object} Genre data formatted for XML
     */
    toXML() {
        const data = this.get();
        return {
            genre: {
                id: data.genre_id,
                name: data.name,
                description: data.description
            }
        };
    }
}

Genre.initialize(
    {
        genre_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    },
    {
        timestamps: false,
        tableName: "genres",
    },
    sequelize
);

module.exports = Genre;
