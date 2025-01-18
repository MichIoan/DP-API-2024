const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");

router.get("/age-distribution", dashboardController.getAgeDistribution);
router.get("/subscriptions-by-month", dashboardController.getSubscriptionsByMonth);
router.get("/active-subscriptions", dashboardController.getActiveSubscriptionsByType);
router.get("/users-by-language", dashboardController.getUsersByLanguage);
router.get("/profiles-per-account", dashboardController.getProfilesPerAccount);
router.get("/common-age-restrictions", dashboardController.getMostCommonAgeRestriction);

module.exports = router;
