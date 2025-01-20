const WatchList = require("../models/WatchList");

const watchListController = {
    getWatchList: async (req, res) => {
        const { profileId } = req.params;

        try {
            const query = `
                SELECT * FROM "watch_list_details"
                WHERE profile_id = :profileId;
            `;
            
            const result = await WatchList.sequelize.query(query, {
                replacements: { profileId },
                type: WatchList.sequelize.QueryTypes.SELECT,
            });

            if (result.length === 0) {
                return res.response(req, res, 404, { message: "No movies found in the watchlist." });
            }

            return res.response(req, res, 200, {
                watchlist: result,
            });
        } catch (error) {
            console.error(error);
            return res.response(req, res, 500, { error: error.message });
        }
    },

    updateWatchList: async (req, res) => {
        const { profileId } = req.params;
        const { movieId } = req.body;

        if (!movieId) {
            return res.response(req, res, 400, {
                message: "Please provide a movieId.",
            });
        }

        try {
            const query = `CALL "RemoveFromWatchList"(:profileId, :movieId);`;
            const values = { profileId, movieId };
            await WatchList.sequelize.query(query, {
                replacements: values,
                type: WatchList.sequelize.QueryTypes.RAW,
            });

            return res.response(req, res, 200, {
                message: "Movie removed from watchlist and marked as watched.",
            });
        } catch (error) {
            console.error(error);
            return res.response(req, res, 500, { error: error.message });
        }
    },
};

module.exports = watchListController;
