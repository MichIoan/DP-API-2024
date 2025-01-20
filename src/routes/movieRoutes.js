const express = require("express");
const router = express.Router();
const movieController = require("../controllers/movieController");
const isLoggedIn = require("../middleware/isLoggedIn");

router.use(isLoggedIn);

router.post("/movie/create", movieController.createMovie);

router.delete("/movie/:movieId/delete", movieController.deleteMovie);

router.get("/movie/:movieId/getMovie", movieController.getMovieById);

router.get("/getMovies", movieController.getMovies);

module.exports = router;
