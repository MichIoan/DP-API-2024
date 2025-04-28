const express = require("express");
const isLoggedIn = require("../middleware/isLoggedIn");
const router = express.Router();

// Import controllers (we'll create or modify these after)
const userController = require("../controllers/userController");
const profileController = require("../controllers/profilesController");
const subscriptionController = require("../controllers/subscriptionController");

// User account endpoints
router.get("/account", isLoggedIn, userController.getUserAccount);
router.put("/account", isLoggedIn, userController.updateUserAccount);
router.delete("/account", isLoggedIn, userController.deleteUserAccount);

// Subscription endpoints
router.get("/subscription", isLoggedIn, subscriptionController.getUserSubscription);
router.post("/subscription", isLoggedIn, subscriptionController.createSubscription);
router.put("/subscription", isLoggedIn, subscriptionController.updateSubscription);
router.delete("/subscription", isLoggedIn, subscriptionController.cancelSubscription);

// Profile endpoints
router.get("/profiles", isLoggedIn, profileController.getUserProfiles);
router.post("/profiles", isLoggedIn, profileController.createProfile);
router.put("/profiles/:profileId", isLoggedIn, profileController.updateProfile);
router.delete("/profiles/:profileId", isLoggedIn, profileController.deleteProfile);

module.exports = router;