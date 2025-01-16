const express = require("express");
const router = express.Router();
const seriesController = require("../controllers/seriesController");

router.post("/series/create", seriesController.createSeries);

router.post("/:seriesId/create-season", seriesController.createSeason);

router.post("/:seasonId/create-episode", seriesController.createEpisode);

router.delete("/series/:seriesId/delete", seriesController.deleteSeries);

router.get("/series/:seriesId/", seriesController.getSeries);

router.get("/series/:seriesId/getSeries", seriesController.getSeriesById);

router.post(
	"/profile/:profileId/:seriesId/:season/:episode/start",
	seriesController.startSeriesEpisode
);

router.post(
	"/profile/:profileId/:seriesId/:season/:episode/end",
	seriesController.endSeriesEpisode
);

module.exports = router;
