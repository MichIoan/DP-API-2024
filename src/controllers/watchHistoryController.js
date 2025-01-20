const WatchHistory = require("../models/WatchHistory");

const watchHistoryController = {
    getHistory: async (req, res) => {
        const { profileId } = req.params;

        if (!profileId) {
            return res.response(req, res, 400, {
                message: "Please provide a profileId to retrieve the watch history.",
            });
        }

        try {
            const query = `
                SELECT * FROM "watch_history_details"
                WHERE profile_id = :profileId;
            `;
            
            const result = await WatchHistory.sequelize.query(query, {
                replacements: { profileId },
                type: WatchHistory.sequelize.QueryTypes.SELECT,
            });

            if (result.length === 0) {
                return res.response(req, res, 404, {
                    message: "No watch history found for the given profileId.",
                });
            }

            return res.response(req, res, 200, result);
        } catch (error) {
            console.error(error);
            return res.response(req, res, 500, { error: error.message });
        }
    },

    updateHistory: async (req, res) => {
        const { profileId } = req.params;
        const { movieId } = req.body;

        if (!movieId) {
            return res.response(req, res, 400, {
                message: "Please provide a movieId to mark the movie as watched.",
            });
        }

        try {
            const query = `CALL "MarkAsWatched"(:profileId, :movieId);`;
            
            const values = { profileId, movieId };
            await WatchHistory.sequelize.query(query, {
                replacements: values,
                type: WatchHistory.sequelize.QueryTypes.RAW,
            });

            return res.response(req, res, 200, {
                message: "Movie marked as watched successfully.",
            });
        } catch (error) {
            console.error(error);
            return res.response(req, res, 500, { error: error.message });
        }
    },
};

module.exports = watchHistoryController;
