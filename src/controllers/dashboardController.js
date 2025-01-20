const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");

router.get("/age-distribution", dashboardController.getAgeDistribution);
router.get("/subscriptions-by-month", dashboardController.getSubscriptionsByMonth);
router.get("/active-subscriptions", dashboardController.getActiveSubscriptionsByType);
router.get("/users-by-language", dashboardController.getUsersByLanguage);
router.get("/profiles-per-account", dashboardController.getProfilesPerAccount);
router.get("/common-age-restrictions", dashboardController.getMostCommonAgeRestriction);

module.exports = router;// src/controllers/dashboardController.js

const { Op } = require("sequelize"); // For advanced querying
const { Users, Profiles, Subscriptions, Media } = require("../models");

// Controller for fetching age distribution of users
const getAgeDistribution = async (req, res) => {
  try {
    const data = await Profiles.findAll({
      attributes: ["age", [sequelize.fn("COUNT", sequelize.col("age")), "count"]],
      group: ["age"],
    });
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch age distribution data." });
  }
};

// Controller for fetching total subscriptions by month
const getSubscriptionsByMonth = async (req, res) => {
  try {
    const data = await Subscriptions.findAll({
      attributes: [
        [sequelize.fn("TO_CHAR", sequelize.col("start_date"), "Month"), "month"],
        [sequelize.fn("COUNT", sequelize.col("subscription_id")), "count"],
      ],
      group: [sequelize.fn("TO_CHAR", sequelize.col("start_date"), "Month")],
    });
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch subscription data." });
  }
};

// Controller for fetching active subscriptions by type
const getActiveSubscriptionsByType = async (req, res) => {
  try {
    const data = await Subscriptions.findAll({
      where: {
        end_date: {
          [Op.gt]: new Date(), // Active subscriptions
        },
      },
      attributes: [
        "type",
        [sequelize.fn("COUNT", sequelize.col("subscription_id")), "count"],
      ],
      group: ["type"],
    });
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch active subscription data." });
  }
};

// Controller for fetching users by language
const getUsersByLanguage = async (req, res) => {
  try {
    const data = await Profiles.findAll({
      attributes: [
        "language",
        [sequelize.fn("COUNT", sequelize.col("profile_id")), "count"],
      ],
      group: ["language"],
    });
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch user language data." });
  }
};

// Controller for fetching profiles per account
const getProfilesPerAccount = async (req, res) => {
  try {
    const data = await Profiles.findAll({
      attributes: [
        "user_id",
        [sequelize.fn("COUNT", sequelize.col("profile_id")), "count"],
      ],
      group: ["user_id"],
    });
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch profiles per account data." });
  }
};

// Controller for fetching most common age restrictions
const getMostCommonAgeRestriction = async (req, res) => {
  try {
    const data = await Media.findAll({
      attributes: [
        "age_restriction",
        [sequelize.fn("COUNT", sequelize.col("media_id")), "count"],
      ],
      group: ["age_restriction"],
    });
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch age restriction data." });
  }
};

module.exports = {
  getAgeDistribution,
  getSubscriptionsByMonth,
  getActiveSubscriptionsByType,
  getUsersByLanguage,
  getProfilesPerAccount,
  getMostCommonAgeRestriction,
};

