const express = require("express");
const router = express.Router();
const watchListController = require("../controllers/watchListController");
const isLoggedIn = require("../middleware/isLoggedIn");

router.use(isLoggedIn);

router.get(
	"/profile/:profileId/getWatchList",
	watchListController.getWatchList
);

router.patch(
	"/profile/:profileId/updateWatchList",
	watchListController.updateWatchList
);

module.exports = router;
