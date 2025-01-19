const express = require("express");
const authController = require("../controllers/authControllers");
const isLoggedIn = require("../middleware/isLoggedIn");

const router = express.Router();

router.use(isLoggedIn);

router.post("/register", authController.register);

router.post("/login", authController.login);

module.exports = router;
