const express = require("express");
const router = express.Router();
const movieController = require("../controllers/movieController");

router.post("/movie/create", movieController.createMovie);

router.delete("/movie/:movieId/delete", movieController.deleteMovie);

router.get("/movie/:movieId/getMovie", movieController.getMovieById);

router.get("/getMovies", movieController.getMovies);

router.get("/series/:seriesId/getSeries", movieController.getSeriesById);

router.post("/:profileId/:movieId/start", movieController.startMovie);

router.post("/:profileId/:movieId/pause", movieController.pauseMovie);

router.post("/:profileId/:movieId/end", movieController.endMovie);

module.exports = router;
