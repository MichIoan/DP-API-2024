const watchListController = {
    getWatchList: async (req, res) => {
        const { profileId } = req.params;

        try {
            const query = `
                SELECT * FROM "watch_list_details"
                WHERE profile_id = $1;
            `;
            
            const values = [profileId];
            const result = await db.query(query, values);

            if (result.rows.length === 0) {
                return res.status(404).json({ message: "No movies found in the watchlist." });
            }

            return res.status(200).json({
                watchlist: result.rows,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Internal server error",
                error: error.message,
            });
        }
    },

    updateWatchList: async (req, res) => {
        const { profileId } = req.params;
        const { movieId } = req.body;

        if (!movieId) {
            return res.status(400).json({
                message: "Please provide a movieId.",
            });
        }

        try {
            const removeFromWatchListQuery = `CALL "RemoveFromWatchList"($1, $2);`;
            const removeValues = [profileId, movieId];
            await db.query(removeFromWatchListQuery, removeValues);

            return res.status(200).json({
                message: "Movie removed from watchlist and marked as watched.",
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Internal server error",
                error: error.message,
            });
        }
    },
};

module.exports = watchListController;
