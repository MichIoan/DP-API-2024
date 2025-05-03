const express = require("express");
const isLoggedIn = require("../middleware/isLoggedIn");
const router = express.Router();

// Import controllers
const userController = require("../controllers/userController");

// All user routes require authentication
router.use(isLoggedIn);

// User account endpoints
router.get("/account", userController.getUserAccount);
router.put("/account", userController.updateUserAccount);
router.delete("/account", userController.deleteUserAccount);

// Referral endpoints
router.get("/referrals", userController.getReferredUsers);
router.post("/referrals/apply", userController.applyReferralCode);

module.exports = router;