const watchHistoryController = {
    getHistory: async (req, res) => {
        const { profileId } = req.params;

        if (!profileId) {
            return res.status(400).json({
                message: "Please provide a profileId to retrieve the watch history.",
            });
        }

        try {
            const query = `
                SELECT * FROM "watch_history_details"
                WHERE profile_id = $1;
            `;
            
            const result = await db.query(query, [profileId]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    message: "No watch history found for the given profileId.",
                });
            }

            return res.status(200).json(result.rows);
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Internal server error",
                error: error.message,
            });
        }
    },

    updateHistory: async (req, res) => {
        const { profileId } = req.params;
        const { movieId } = req.body;

        if (!movieId) {
            return res.status(400).json({
                message: "Please provide a movieId to mark the movie as watched.",
            });
        }

        try {
            const query = `CALL "MarkAsWatched"($1, $2);`;
            
            const values = [profileId, movieId];
            await db.query(query, values);

            return res.status(200).json({
                message: "Movie marked as watched successfully.",
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

module.exports = watchHistoryController;
