const express = require("express");
const router = express.Router();
const watchListController = require("../controllers/watchListController");

router.get(
	"/profile/:profileId/getWatchList",
	watchListController.getWatchList
);

router.patch(
	"/profile/:profileId/updateWatchList",
	watchListController.updateWatchList
);

module.exports = router;
