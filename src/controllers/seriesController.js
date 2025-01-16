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