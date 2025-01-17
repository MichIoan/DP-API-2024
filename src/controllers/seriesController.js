const { Series, Season, Episode, Profile } = require("../models"); // Assuming Sequelize models are used
const response = (req, res, statusCode, data) => {
    res.status(statusCode).json(data);
};

const createSeries = async (req, res) => {
    const series = req.body;

    if (!series.title || !series.start_date || !series.genre || !series.viewing_classification) {
        response(req, res, 400, {
            message: "Please provide the necessary properties for the series."
        });
        return;
    }

    try {
        const newSeries = await Series.create({
            title: series.title,
            age_restriction: series.age_restriction || null,
            start_date: series.start_date,
            genre: series.genre,
            viewing_classification: series.viewing_classification,
        });

        response(req, res, 200, {
            message: "Series added successfully.",
            series: newSeries
        });
    } catch (err) {
        console.log(err);
        response(res, 500, {
            error: "Internal server error"
        });
    }
};

const createSeason = async (req, res) => {
    const { seriesId } = req.params;
    const { title, season_number } = req.body;

    if (!title || !season_number) {
        response(req, res, 400, {
            message: "Please provide title and season number."
        });
        return;
    }

    try {
        const newSeason = await Season.create({
            title,
            season_number,
            seriesId
        });

        response(req, res, 200, {
            message: "Season added successfully.",
            season: newSeason
        });
    } catch (err) {
        console.log(err);
        response(res, 500, {
            error: "Internal server error"
        });
    }
};

const createEpisode = async (req, res) => {
    const { seasonId } = req.params;
    const { title, episode_number, duration } = req.body;

    if (!title || !episode_number || !duration) {
        response(req, res, 400, {
            message: "Please provide title, episode number, and duration."
        });
        return;
    }

    try {
        const newEpisode = await Episode.create({
            title,
            episode_number,
            duration,
            seasonId
        });

        response(req, res, 200, {
            message: "Episode added successfully.",
            episode: newEpisode
        });
    } catch (err) {
        console.log(err);
        response(res, 500, {
            error: "Internal server error"
        });
    }
};

const deleteSeries = async (req, res) => {
    const { seriesId } = req.params;

    try {
        const result = await Series.destroy({
            where: { id: seriesId }
        });

        if (result === 0) {
            response(req, res, 404, {
                message: "Series not found."
            });
            return;
        }

        response(req, res, 200, {
            message: "Series deleted successfully."
        });
    } catch (err) {
        console.log(err);
        response(res, 500, {
            error: "Internal server error"
        });
    }
};

const getSeries = async (req, res) => {
    try {
        const series = await Series.findAll();

        if (series.length === 0) {
            response(req, res, 200, {
                message: "You have no series in your database."
            });
            return;
        }

        response(req, res, 200, { series });
    } catch (err) {
        response(res, 500, {
            error: "Internal server error"
        });
    }
};

const getSeriesById = async (req, res) => {
    const { seriesId } = req.params;

    try {
        const series = await Series.findByPk(seriesId);

        if (!series) {
            response(req, res, 404, {
                message: "Series not found."
            });
            return;
        }

        response(req, res, 200, { series });
    } catch (err) {
        console.log(err);
        response(res, 500, {
            error: "Internal server error"
        });
    }
};

const startSeriesEpisode = async (req, res) => {
    const { profileId, seriesId, season, episode } = req.params;

    try {
        // Logic to mark episode as started (add to user's profile or watch history)
        response(req, res, 200, {
            message: `Started watching series ${seriesId}, season ${season}, episode ${episode}.`
        });
    } catch (err) {
        console.log(err);
        response(res, 500, {
            error: "Internal server error"
        });
    }
};

const endSeriesEpisode = async (req, res) => {
    const { profileId, seriesId, season, episode } = req.params;

    try {
        // Logic to mark episode as finished (update user's profile or watch history)
        response(req, res, 200, {
            message: `Finished watching series ${seriesId}, season ${season}, episode ${episode}.`
        });
    } catch (err) {
        console.log(err);
        response(res, 500, {
            error: "Internal server error"
        });
    }
};

module.exports = {
    createSeries,
    createSeason,
    createEpisode,
    deleteSeries,
    getSeries,
    getSeriesById,
    startSeriesEpisode,
    endSeriesEpisode
};