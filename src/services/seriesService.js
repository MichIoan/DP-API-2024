/**
 * Service for handling series-related operations
 * Implements business logic for series, seasons, and episodes
 */

const { Series } = require("../models/Series");
const { Season } = require("../models/Season");
const { Episode } = require("../models/Media");
const sequelize = require("../config/sequelize");

class SeriesService {
    /**
     * Create a new series
     * @param {Object} seriesData - Series data
     * @returns {Promise<Object>} Created series
     */
    async createSeries(seriesData) {
        const transaction = await sequelize.transaction();
        
        try {
            const newSeries = await Series.create({
                title: seriesData.title,
                age_restriction: seriesData.age_restriction || null,
                start_date: seriesData.start_date,
                genre: seriesData.genre,
                viewing_classification: seriesData.viewing_classification,
            }, { transaction });
            
            await transaction.commit();
            return newSeries;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Get all series with optional filtering
     * @param {Object} options - Filter options
     * @returns {Promise<Array>} List of series
     */
    async getAllSeries(options = {}) {
        const { page = 1, limit = 20, genre, classification } = options;
        const offset = (page - 1) * limit;
        
        const whereClause = {};
        if (genre) whereClause.genre = genre;
        if (classification) whereClause.viewing_classification = classification;
        
        const { count, rows: series } = await Series.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            order: [['start_date', 'DESC']]
        });
        
        return {
            series,
            pagination: {
                total: count,
                page,
                limit,
                pages: Math.ceil(count / limit)
            }
        };
    }

    /**
     * Get a series by ID with its seasons and episodes
     * @param {number} seriesId - Series ID
     * @returns {Promise<Object>} Series with seasons and episodes
     */
    async getSeriesById(seriesId) {
        return Series.findByPk(seriesId, {
            include: [
                {
                    model: Season,
                    include: [Episode],
                },
            ],
        });
    }

    /**
     * Delete a series and all related seasons and episodes
     * @param {number} seriesId - Series ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteSeries(seriesId) {
        const transaction = await sequelize.transaction();
        
        try {
            const series = await Series.findByPk(seriesId, { transaction });
            
            if (!series) {
                await transaction.rollback();
                return false;
            }
            
            // Find all seasons for this series
            const seasons = await Season.findAll({ 
                where: { series_id: seriesId },
                transaction
            });
            
            // Delete all episodes for each season
            for (const season of seasons) {
                await Episode.destroy({ 
                    where: { season_id: season.season_id },
                    transaction
                });
            }
            
            // Delete all seasons
            await Season.destroy({ 
                where: { series_id: seriesId },
                transaction
            });
            
            // Delete the series
            await series.destroy({ transaction });
            
            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Update a series
     * @param {number} seriesId - Series ID
     * @param {Object} seriesData - Updated series data
     * @returns {Promise<Object>} Updated series
     */
    async updateSeries(seriesId, seriesData) {
        const transaction = await sequelize.transaction();
        
        try {
            const series = await Series.findByPk(seriesId, { transaction });
            
            if (!series) {
                await transaction.rollback();
                return null;
            }
            
            await series.update(seriesData, { transaction });
            
            await transaction.commit();
            return series;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Get all seasons for a series
     * @param {number} seriesId - Series ID
     * @returns {Promise<Array>} List of seasons
     */
    async getSeasons(seriesId) {
        return Season.findAll({
            where: { series_id: seriesId },
            order: [['season_number', 'ASC']]
        });
    }

    /**
     * Get a season by ID with its episodes
     * @param {number} seasonId - Season ID
     * @returns {Promise<Object>} Season with episodes
     */
    async getSeasonById(seasonId) {
        return Season.findByPk(seasonId, {
            include: [Episode]
        });
    }

    /**
     * Create a new season for a series
     * @param {number} seriesId - Series ID
     * @param {Object} seasonData - Season data
     * @returns {Promise<Object>} Created season
     */
    async createSeason(seriesId, seasonData) {
        const transaction = await sequelize.transaction();
        
        try {
            const series = await Series.findByPk(seriesId, { transaction });
            
            if (!series) {
                await transaction.rollback();
                return null;
            }
            
            const newSeason = await Season.create({
                series_id: seriesId,
                season_number: seasonData.season_number,
                title: seasonData.title,
                description: seasonData.description || null,
            }, { transaction });
            
            await transaction.commit();
            return newSeason;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Update a season
     * @param {number} seasonId - Season ID
     * @param {Object} seasonData - Updated season data
     * @returns {Promise<Object>} Updated season
     */
    async updateSeason(seasonId, seasonData) {
        const transaction = await sequelize.transaction();
        
        try {
            const season = await Season.findByPk(seasonId, { transaction });
            
            if (!season) {
                await transaction.rollback();
                return null;
            }
            
            await season.update(seasonData, { transaction });
            
            await transaction.commit();
            return season;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Delete a season and all its episodes
     * @param {number} seasonId - Season ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteSeason(seasonId) {
        const transaction = await sequelize.transaction();
        
        try {
            const season = await Season.findByPk(seasonId, { transaction });
            
            if (!season) {
                await transaction.rollback();
                return false;
            }
            
            // Delete all episodes for this season
            await Episode.destroy({ 
                where: { season_id: seasonId },
                transaction
            });
            
            // Delete the season
            await season.destroy({ transaction });
            
            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Get all episodes for a season
     * @param {number} seasonId - Season ID
     * @returns {Promise<Array>} List of episodes
     */
    async getEpisodes(seasonId) {
        return Episode.findAll({
            where: { season_id: seasonId },
            order: [['episode_number', 'ASC']]
        });
    }

    /**
     * Get an episode by ID
     * @param {number} episodeId - Episode ID
     * @returns {Promise<Object>} Episode
     */
    async getEpisodeById(episodeId) {
        return Episode.findByPk(episodeId);
    }

    /**
     * Create a new episode for a season
     * @param {number} seasonId - Season ID
     * @param {Object} episodeData - Episode data
     * @returns {Promise<Object>} Created episode
     */
    async createEpisode(seasonId, episodeData) {
        const transaction = await sequelize.transaction();
        
        try {
            const season = await Season.findByPk(seasonId, { transaction });
            
            if (!season) {
                await transaction.rollback();
                return null;
            }
            
            const newEpisode = await Episode.create({
                season_id: seasonId,
                episode_number: episodeData.episode_number,
                title: episodeData.title,
                duration: episodeData.duration,
                description: episodeData.description || null,
            }, { transaction });
            
            await transaction.commit();
            return newEpisode;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Update an episode
     * @param {number} episodeId - Episode ID
     * @param {Object} episodeData - Updated episode data
     * @returns {Promise<Object>} Updated episode
     */
    async updateEpisode(episodeId, episodeData) {
        const transaction = await sequelize.transaction();
        
        try {
            const episode = await Episode.findByPk(episodeId, { transaction });
            
            if (!episode) {
                await transaction.rollback();
                return null;
            }
            
            await episode.update(episodeData, { transaction });
            
            await transaction.commit();
            return episode;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Delete an episode
     * @param {number} episodeId - Episode ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteEpisode(episodeId) {
        const transaction = await sequelize.transaction();
        
        try {
            const episode = await Episode.findByPk(episodeId, { transaction });
            
            if (!episode) {
                await transaction.rollback();
                return false;
            }
            
            await episode.destroy({ transaction });
            
            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Record start of episode watching
     * @param {number} profileId - Profile ID
     * @param {number} episodeId - Episode ID
     * @returns {Promise<Object>} Watch session info
     */
    async startWatchingEpisode(profileId, episodeId) {
        // This would typically create a watch session entry in the database
        // For now, we'll just return a mock object
        return {
            profileId,
            episodeId,
            startTime: new Date()
        };
    }

    /**
     * Record end of episode watching
     * @param {number} profileId - Profile ID
     * @param {number} episodeId - Episode ID
     * @param {number} watchedDuration - Duration watched in seconds
     * @param {boolean} completed - Whether the episode was completed
     * @returns {Promise<Object>} Watch history entry
     */
    async endWatchingEpisode(profileId, episodeId, watchedDuration, completed = false) {
        // This would typically update a watch history entry in the database
        // For now, we'll just return a mock object
        return {
            profileId,
            episodeId,
            watchedDuration,
            completed,
            endTime: new Date()
        };
    }
}

// Create a singleton instance
const seriesService = new SeriesService();

// Export the instance
module.exports = seriesService;
