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
