const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscriptionController");

router.get("/subscriptions", subscriptionController.getAllSubscriptions);

router.patch("/subscriptions/:subscriptionId", subscriptionController.updateSubscription);

router.delete("/subscriptions/:subscriptionId", subscriptionController.deleteSubscription);

module.exports = router;
