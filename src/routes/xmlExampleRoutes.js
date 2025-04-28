/**
 * Routes for XML example endpoints
 * Demonstrates XML response capabilities
 */

const express = require("express");
const router = express.Router();
const xmlExampleController = require("../controllers/xmlExampleController");
const isLoggedIn = require("../middleware/isLoggedIn");

// Public endpoint - no authentication required
router.get("/public", xmlExampleController.getXmlExample);

// Protected endpoint - requires authentication
router.get("/protected", isLoggedIn, xmlExampleController.getXmlAlt);

module.exports = router;
