const { Media } = require("../models");

const createMovie = async (req, res) => {
    const movie = req.body;

    if (!movie.title || !movie.duration) {
        return res.status(400).json({
            message: "Please provide at least a title and a duration for the movie.",
        });
    }

    try {
        const newMovie = await Media.create({
            title: movie.title,
            duration: movie.duration,
            release_date: movie.release_date || null,
            episode_number: null,
            season_id: null,
        });

        return res.status(201).json({
            message: "Movie added successfully.",
            movie: newMovie,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: "Internal server error",
        });
    }
};
