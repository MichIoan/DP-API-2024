const express = require("express");
const router = express.Router();
const watchHistoryController = require("../controllers/watchHistoryController");

router.get(
	"/profile/:profileId/getWatchHistory",
	watchHistoryController.getHistory
);

router.patch(
	"/profile/:profileId/updateWatchHistory",
	watchHistoryController.updateHistory
);

module.exports = router;
