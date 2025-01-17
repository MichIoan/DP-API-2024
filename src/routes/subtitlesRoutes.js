const express = require("express");
const router = express.Router();
const subtitlesController = require("../controllers/subtitlesController");

router.post("/subtitles/create", subtitlesController.createSubtitles);

router.delete("/subtitles/:subtitlesId/delete", subtitlesController.deleteSubtitles);

router.get("/media/:mediaId/getSubtitles", subtitlesController.getSubtitlesByMediaId);

router.get("/subtitles/:subtitlesId/get", subtitlesController.getSubtitlesById);

router.put("/subtitles/:subtitlesId/update", subtitlesController.updateSubtitles);

router.get("/getSubtitles", subtitlesController.getAllSubtitles);

module.exports = router;
