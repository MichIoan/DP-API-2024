const express = require("express");
const router = express.Router();
const watchHistoryController = require("../controllers/watchHistoryController");
const isLoggedIn = require("../middleware/isLoggedIn");

router.use(isLoggedIn);

router.get(
	"/profile/:profileId/getWatchHistory",
	watchHistoryController.getHistory
);

router.patch(
	"/profile/:profileId/updateWatchHistory",
	watchHistoryController.updateHistory
);

module.exports = router;
