const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profilesController");

router.get("/user/:userId/profiles", profileController.getAllProfiles);
router.post("/user/:userId/profiles", profileController.createProfile);
router.get("/profiles/:profileId", profileController.getProfileById);
router.patch("/profiles/:profileId", profileController.updateProfile);
router.delete("/profiles/:profileId", profileController.deleteProfile);

module.exports = router;
