const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const register = async (req, res) => {
	try {
		const email = req.body.email;

		//check if user exists
		const existingUser = await User.findOne({
			where: {
				email: email,
			},
		});

		if (existingUser) {
			return res.response(req, res, 400, {
				error: "User with this email already exists",
			});
		}

		//if not, get passwd and generate referral
		const password = await bcrypt.hash(req.body.password, 10);

		await User.create({
			email: email,
			password: password,
			refferal_code: req.body.refferal_id ?? null,
		});

		res.response(req, res, 201, {
			message: "User was created succesfully.",
		});
	} catch (error) {
		res.response(req, res, 400, { error: error });
		console.log(error);
	}
};

const login = async (req, res) => {
	try {
		const email = req.body.email;
		const password = req.body.password;

		if (!isValidEmail(email)) {
			return res.response(req, res, 404, { error: "Email invalid" });
		}

		//get existing user if there is one
		const existingUser = await User.findOne({
			where: {
				email: email,
			},
		});

		if (!existingUser) {
			return res.response(req, res, 404, {
				error: "No user with these credentials",
			});
		}

		if (existingUser.status == "notActive") {
			return res.response(req, res, 403, {
				error: "Your account wasn't activated yet!",
			});
		}

		if (existingUser.status == "suspended") {
			const timeNow = new Date();
			if (timeNow > existingUser.locked_until) {
				existingUser.update({
					status: "active",
					locked_until: null,
					failed_login_attempts: 0,
				});
			} else {
				return res.response(req, res, 403, {
					error: `You need wait until ${lockedUntil}`,
				});
			}
		}

		const isPasswordValid = await bcrypt.compare(
			password,
			existingUser.password
		);

		if (!isPasswordValid) {
			const counter = existingUser.failed_login_attempts + 1;

			if (counter === 3) {
				const oneHourFromNow = new Date();
				oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);

				existingUser.update({
					status: "suspended",
					locked_until: oneHourFromNow,
					failed_login_attempts: counter,
				});

				return res.response(req, res, 403, {
					error: `You need wait until ${lockedUntil}`,
				});
			}

			existingUser.update({
				failed_login_attempts: counter,
			});

			const leftAttempts = 3 - counter;
			return res.response(req, res, 401, {
				error: `Invalid password. You have ${leftAttempts} attempts left.`,
			});
		}

		// If the password is valid, generate a JWT token
		const token = jwt.sign(
			{ userId: existingUser.id, email: existingUser.email, type: "access" },
			process.env.JWT_KEY, // Secret key
			{ expiresIn: "6h" }
		);

		existingUser.update({
			failed_login_attempts: 0,
			locked_until: null,
		});

		res.response(req, res, 200, {
			message: "Login successful",
			token: token,
		});
	} catch (error) {
		console.error("Error during login:", error);
		res.response(req, res, 500, { error: "Internal server error" });
	}
};

function isValidEmail(email) {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

module.exports = { register, login };
