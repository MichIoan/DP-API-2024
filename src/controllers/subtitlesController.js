const { Subtitles } = require("../models");

const createSubtitles = async (req, res) => {
    const subtitles = req.body;

    if (!subtitles.media_id) {
        return res.status(400).json({
            message: "Please provide a media_id for the subtitles.",
        });
    }

    try {
        const newSubtitles = await Subtitles.create({
            media_id: subtitles.media_id,
        });

        return res.status(201).json({
            message: "Subtitles created successfully.",
            subtitles: newSubtitles,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: "Internal server error",
        });
    }
};

const deleteSubtitles = async (req, res) => {
    const { subtitlesId } = req.params;

    try {
        const deleted = await Subtitles.destroy({
            where: { subtitles_id: subtitlesId },
        });

        if (!deleted) {
            return res.status(404).json({
                message: "Subtitles not found.",
            });
        }

        return res.status(200).json({
            message: "Subtitles deleted successfully.",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: "Internal server error",
        });
    }
};

const getSubtitlesByMediaId = async (req, res) => {
    const { mediaId } = req.params;

    try {
        const subtitles = await Subtitles.findAll({
            where: { media_id: mediaId },
        });

        if (!subtitles.length) {
            return res.status(404).json({
                message: "No subtitles found for the specified media.",
            });
        }

        return res.status(200).json(subtitles);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: "Internal server error",
        });
    }
};

