const DbUtils = require('../utils/dbUtils');
const { Media } = require('../models/Media');
const { Series } = require('../models/Series');
const { Season } = require('../models/Season');
const { Genre } = require('../models/Genre');
const { MediaGenres } = require('../models/MediaGenres');
const { WatchHistory } = require('../models/WatchHistory');
const { WatchList } = require('../models/WatchList');
const sequelize = require('../config/sequelize');

/**
 * Service for handling media-related operations
 * Uses stored procedures and transactions for data integrity
 */
class MediaService {
    /**
     * Get all media with pagination and filtering
     * @param {Object} options - Query options
     * @returns {Promise<Object>} - Media items with pagination info
     */
    async getAllMedia(options = {}) {
        const { 
            page = 1, 
            limit = 20, 
            genre = null, 
            type = null, 
            classification = null 
        } = options;
        
        const offset = (page - 1) * limit;
        const whereClause = {};
        
        // Add type filter if provided
        if (type) {
            whereClause.type = type;
        }
        
        // Add classification filter if provided
        if (classification) {
            whereClause.content_classification = classification;
        }
        
        try {
            let query = {
                where: whereClause,
                limit,
                offset,
                include: [
                    { model: Genre }
                ]
            };
            
            // Add genre filter if provided
            if (genre) {
                query.include[0].where = { name: genre };
            }
            
            // Get media with total count
            const { count, rows } = await Media.findAndCountAll(query);
            
            return {
                media: rows,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(count / limit)
                }
            };
        } catch (error) {
            console.error('Error getting media:', error);
            throw error;
        }
    }
    
    /**
     * Get media by ID with all related data
     * @param {number} mediaId - Media ID
     * @returns {Promise<Object>} - Media with related data
     */
    async getMediaById(mediaId) {
        try {
            const media = await Media.findByPk(mediaId, {
                include: [
                    { model: Genre },
                    { model: Season, include: [{ model: Series }] }
                ]
            });
            
            if (!media) {
                throw new Error('Media not found');
            }
            
            return media;
        } catch (error) {
            console.error('Error getting media by ID:', error);
            throw error;
        }
    }
    
    /**
     * Add media to watch list
     * @param {number} profileId - Profile ID
     * @param {number} mediaId - Media ID
     * @returns {Promise<Object>} - Created watch list entry
     */
    async addToWatchList(profileId, mediaId) {
        try {
            // Call the AddToWatchList stored procedure
            await DbUtils.callProcedure('AddToWatchList', [profileId, mediaId]);
            
            // Get the created watch list entry
            const watchListEntry = await WatchList.findOne({
                where: {
                    profile_id: profileId,
                    media_id: mediaId
                },
                order: [['created_at', 'DESC']]
            });
            
            return watchListEntry;
        } catch (error) {
            console.error('Error adding to watch list:', error);
            throw error;
        }
    }
    
    /**
     * Mark media as watched
     * @param {number} profileId - Profile ID
     * @param {number} mediaId - Media ID
     * @param {number} progress - Viewing progress (0-100)
     * @returns {Promise<Object>} - Created watch history entry
     */
    async markAsWatched(profileId, mediaId, progress = 100) {
        try {
            // Call the MarkAsWatched stored procedure
            await DbUtils.callProcedure('MarkAsWatched', [profileId, mediaId, progress]);
            
            // Get the created watch history entry
            const watchHistoryEntry = await WatchHistory.findOne({
                where: {
                    profile_id: profileId,
                    media_id: mediaId
                },
                order: [['watched_at', 'DESC']]
            });
            
            return watchHistoryEntry;
        } catch (error) {
            console.error('Error marking as watched:', error);
            throw error;
        }
    }
    
    /**
     * Get watch history for a profile
     * @param {number} profileId - Profile ID
     * @param {number} limit - Maximum number of items
     * @returns {Promise<Array>} - Watch history entries
     */
    static async getWatchHistory(profileId, limit = 20) {
        try {
            // Query the watch_history_details view
            const history = await DbUtils.queryView('watch_history_details', { profile_id: profileId });
            
            return history.slice(0, limit);
        } catch (error) {
            console.error('Error getting watch history:', error);
            throw error;
        }
    }
    
    /**
     * Get watch list for a profile
     * @param {number} profileId - Profile ID
     * @param {number} limit - Maximum number of items
     * @returns {Promise<Array>} - Watch list entries
     */
    static async getWatchList(profileId, limit = 20) {
        try {
            // Query the watch_list_details view
            const watchList = await DbUtils.queryView('watch_list_details', { profile_id: profileId });
            
            return watchList.slice(0, limit);
        } catch (error) {
            console.error('Error getting watch list:', error);
            throw error;
        }
    }
    
    /**
     * Get recommended content for a profile based on watch history
     * @param {number} profileId - Profile ID
     * @param {number} limit - Maximum number of recommendations
     * @returns {Promise<Array>} - Recommended content
     */
    static async getRecommendedContent(profileId, limit = 10) {
        try {
            // Call the GetRecommendedContent function
            const recommendations = await DbUtils.callFunction('GetRecommendedContent', [profileId, limit]);
            return recommendations;
        } catch (error) {
            console.error('Error getting recommended content:', error);
            throw error;
        }
    }
    
    /**
     * Search for media by title, description, or genre
     * @param {string} query - Search query
     * @param {number} limit - Maximum number of results
     * @returns {Promise<Array>} - Search results
     */
    static async searchMedia(query, limit = 20) {
        try {
            // Use raw SQL for full-text search capabilities
            const searchQuery = `
                SELECT m.* 
                FROM media m
                LEFT JOIN media_genres mg ON m.media_id = mg.media_id
                LEFT JOIN genres g ON mg.genre_id = g.genre_id
                WHERE 
                    m.title ILIKE :search
                    OR m.description ILIKE :search
                    OR g.name ILIKE :search
                GROUP BY m.media_id
                LIMIT :limit
            `;
            
            const results = await sequelize.query(searchQuery, {
                replacements: { 
                    search: `%${query}%`,
                    limit
                },
                type: sequelize.QueryTypes.SELECT,
                model: Media
            });
            
            return results;
        } catch (error) {
            console.error('Error searching media:', error);
            throw error;
        }
    }
    
    /**
     * Create a new movie
     * @param {Object} movieData - Movie data
     * @returns {Promise<Object>} - Created movie
     */
    async createMovie(movieData) {
        try {
            // Set media type to 'movie'
            movieData.type = 'movie';
            
            // Start a transaction
            const transaction = await sequelize.transaction();
            
            try {
                // Create the media record
                const movie = await Media.create(movieData, { transaction });
                
                // Handle genres if provided
                if (movieData.genres && Array.isArray(movieData.genres)) {
                    // Find or create genres
                    const genrePromises = movieData.genres.map(async (genreName) => {
                        const [genre] = await Genre.findOrCreate({
                            where: { name: genreName },
                            transaction
                        });
                        return genre;
                    });
                    
                    const genres = await Promise.all(genrePromises);
                    
                    // Associate genres with the movie
                    await movie.addGenres(genres, { transaction });
                }
                
                // Commit the transaction
                await transaction.commit();
                
                // Return the movie with genres
                return await Media.findByPk(movie.id, {
                    include: [{ model: Genre }]
                });
            } catch (error) {
                // Rollback the transaction on error
                await transaction.rollback();
                throw error;
            }
        } catch (error) {
            console.error('Error creating movie:', error);
            throw error;
        }
    }
    
    /**
     * Get a movie by ID
     * @param {string|number} movieId - Movie ID
     * @returns {Promise<Object>} - Movie with genres
     */
    async getMovieById(movieId) {
        try {
            const movie = await Media.findOne({
                where: {
                    id: movieId,
                    type: 'movie'
                },
                include: [{ model: Genre }]
            });
            
            return movie;
        } catch (error) {
            console.error('Error getting movie by ID:', error);
            throw error;
        }
    }
    
    /**
     * Delete a movie by ID
     * @param {string|number} movieId - Movie ID
     * @returns {Promise<boolean>} - True if deleted, false if not found
     */
    async deleteMovie(movieId) {
        try {
            // Start a transaction
            const transaction = await sequelize.transaction();
            
            try {
                // Find the movie
                const movie = await Media.findOne({
                    where: {
                        id: movieId,
                        type: 'movie'
                    },
                    transaction
                });
                
                if (!movie) {
                    await transaction.commit();
                    return false;
                }
                
                // Remove genre associations
                await movie.setGenres([], { transaction });
                
                // Delete the movie
                await movie.destroy({ transaction });
                
                // Commit the transaction
                await transaction.commit();
                
                return true;
            } catch (error) {
                // Rollback the transaction on error
                await transaction.rollback();
                throw error;
            }
        } catch (error) {
            console.error('Error deleting movie:', error);
            throw error;
        }
    }
    
    /**
     * Update a movie by ID
     * @param {string|number} movieId - Movie ID
     * @param {Object} movieData - Updated movie data
     * @returns {Promise<Object>} - Updated movie
     */
    async updateMovie(movieId, movieData) {
        try {
            // Start a transaction
            const transaction = await sequelize.transaction();
            
            try {
                // Find the movie
                const movie = await Media.findOne({
                    where: {
                        id: movieId,
                        type: 'movie'
                    },
                    transaction
                });
                
                if (!movie) {
                    await transaction.commit();
                    return null;
                }
                
                // Ensure type remains 'movie'
                movieData.type = 'movie';
                
                // Update movie data
                await movie.update(movieData, { transaction });
                
                // Handle genres if provided
                if (movieData.genres && Array.isArray(movieData.genres)) {
                    // Find or create genres
                    const genrePromises = movieData.genres.map(async (genreName) => {
                        const [genre] = await Genre.findOrCreate({
                            where: { name: genreName },
                            transaction
                        });
                        return genre;
                    });
                    
                    const genres = await Promise.all(genrePromises);
                    
                    // Replace existing genre associations
                    await movie.setGenres(genres, { transaction });
                }
                
                // Commit the transaction
                await transaction.commit();
                
                // Return the updated movie with genres
                return await Media.findByPk(movie.id, {
                    include: [{ model: Genre }]
                });
            } catch (error) {
                // Rollback the transaction on error
                await transaction.rollback();
                throw error;
            }
        } catch (error) {
            console.error('Error updating movie:', error);
            throw error;
        }
    }
    
    /**
     * Get all movies with optional filtering
     * @param {Object} options - Query options
     * @returns {Promise<Object>} - Movies with pagination info
     */
    async getMovies(options = {}) {
        const { 
            page = 1, 
            limit = 20, 
            genre = null, 
            classification = null 
        } = options;
        
        const offset = (page - 1) * limit;
        const whereClause = { type: 'movie' };
        
        // Add classification filter if provided
        if (classification) {
            whereClause.content_classification = classification;
        }
        
        try {
            let query = {
                where: whereClause,
                limit,
                offset,
                include: []
            };
            
            // Add genre filter if provided
            if (genre) {
                query.include.push({
                    model: Genre,
                    where: { name: genre }
                });
            } else {
                query.include.push({ model: Genre });
            }
            
            // Get movies with total count
            const { count, rows } = await Media.findAndCountAll(query);
            
            // Calculate pagination info
            const totalPages = Math.ceil(count / limit);
            const hasNext = page < totalPages;
            const hasPrevious = page > 1;
            
            return {
                movies: rows,
                pagination: {
                    total: count,
                    page,
                    limit,
                    totalPages,
                    hasNext,
                    hasPrevious
                }
            };
        } catch (error) {
            console.error('Error getting movies:', error);
            throw error;
        }
    }
}

// Create a singleton instance
const mediaService = new MediaService();

// Export the instance
module.exports = mediaService;
