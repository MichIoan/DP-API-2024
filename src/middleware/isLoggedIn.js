const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendResponse = require("../utils/sendResponse");

async function isLoggedIn(req, res, next) {
	const decoded = getToken(req, res);
	if (res.headersSent) return; //cehks if headers have been sent already and stops the function

	const email = decoded.email;

	try {
		const user = await User.findOne({
			where: {
				email: email,
			},
		});

		if (user.status === "locked") {
			sendResponse(req, res, 401, {
				message: "Locked account, try again later.",
			});
			return;
		}

		if (user.status === "not_activated") {
			sendResponse(req, res, 401, {
				message: "Account not activated",
			});
			return;
		}

		next();
	} catch (err) {
		console.log(err);
		response(req, res, 500, { error: "Internal server error" });
		return;
	}
}

async function getToken(req, res) {
	const header = req.headers.authorization;
	let token;

	if (!header) {
		sendResponse(req, res, 400, { error: "No token provided" });
	}

	const bearer = header.split(" ");
	if (bearer.length == 2 && bearer[0] === "Bearer") {
		token = bearer[1]; // Return the token
	}

	let decoded;
	try {
		decoded = jwt.verify(token, process.env.JWT_KEY);
	} catch (error) {
		if (error instanceof jwt.TokenExpiredError) {
			sendResponse(req, res, 403, { error: "Token expired" });
			return;
		} else {
			sendResponse(req, res, 400, { error: "Invalid token" });
			return;
		}
	}

	return decoded;
}

module.exports = { isLoggedIn };
