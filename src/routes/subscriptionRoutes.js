const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscriptionController");
const isLoggedIn = require("../middleware/isLoggedIn");

// Apply authentication middleware to all routes
router.use(isLoggedIn);

// Get all subscriptions (admin only)
router.get("/all", subscriptionController.getAllSubscriptions);

// Get current user's subscription
router.get("/", subscriptionController.getUserSubscription);

// Create a new subscription
router.post("/", subscriptionController.createSubscription);

// Update current user's subscription
router.put("/", subscriptionController.updateSubscription);

// Cancel current user's subscription
router.delete("/", subscriptionController.cancelSubscription);

// Get recommended content for a profile
router.get("/recommendations/:profileId", subscriptionController.getRecommendedContent);

module.exports = router;
