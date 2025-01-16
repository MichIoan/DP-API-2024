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

const deleteMovie = async (req, res) => {
    const { movieId } = req.params;

    try {
        const deleted = await Media.destroy({
            where: { media_id: movieId },
        });

        if (!deleted) {
            return res.status(404).json({
                message: "Movie not found.",
            });
        }

        return res.status(200).json({
            message: "Movie deleted successfully.",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: "Internal server error",
        });
    }
};

